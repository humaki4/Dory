import matter from 'gray-matter';

import { BadRequestError } from '../../core/errors';
import { FastifyInstance } from 'fastify';
import { Collection } from 'mongodb';
import { FileContent, RepositoryMetadata } from './vcsProvider/IVcsProvider';
import { CollectorDocumentProcessedEvent, CollectorRepositorySyncCompletedEvent } from './events';
import { parseGithubRepositoryInput } from './repositoryInput';

interface ScannableRepository {
  provider: string;
  id: string;
  space: string;
  name: string;
  fullPath: string;
  url: string;
  defaultBranch: string;
  isPrivate: boolean;
  updatedAt: string;
  description?: string;
}

interface ScanRepositoryOptions {
  branch?: string;
  pathPattern?: string;
  maxFiles?: number;
}

type SourceSyncRepositoryRecord = {
  fullName: string;
  space: string;
  name: string;
  sourceId?: string;
  provider?: string;
  url?: string;
  defaultBranch?: string;
  isPrivate?: boolean;
  isPublicSource?: boolean;
  updatedAt?: string;
  description?: string;
};

type CollectorServiceContext = Pick<FastifyInstance, 'vcsProvider' | 'eventBus' | 'log' | 'mongo'>;

const DEFAULT_PUBLIC_REPOSITORY_FILE_LIMIT = 5;
const MAX_PUBLIC_REPOSITORY_FILE_LIMIT = 100;

function getPublicRepositoryFileLimit(): number {
  const configuredLimit = Number(process.env.COLLECTOR_PUBLIC_REPOSITORY_MAX_FILES);
  if (!Number.isInteger(configuredLimit) || configuredLimit < 1) {
    return DEFAULT_PUBLIC_REPOSITORY_FILE_LIMIT;
  }

  return Math.min(configuredLimit, MAX_PUBLIC_REPOSITORY_FILE_LIMIT);
}

export class CollectorService {
  private readonly vcsProvider: CollectorServiceContext['vcsProvider'];
  private readonly eventBus: CollectorServiceContext['eventBus'];
  private readonly log: CollectorServiceContext['log'];
  private readonly sourcesCollection?: Collection<SourceSyncRepositoryRecord>;

  constructor({ vcsProvider, eventBus, log, mongo }: Partial<CollectorServiceContext>) {
    if (!vcsProvider || !eventBus || !log) {
      throw new Error('CollectorService dependencies are not fully configured');
    }

    this.vcsProvider = vcsProvider;
    this.eventBus = eventBus;
    this.log = log;

    //TODO: Collector sollte keinen Zugriff auf die DB haben
    const mongoDb = mongo?.db;
    if (mongoDb) {
      this.sourcesCollection = mongoDb.collection<SourceSyncRepositoryRecord>('document_sources2');
    }
  }

  async listScannableRepositories(): Promise<ScannableRepository[]> {
    const repositories = await this.vcsProvider.listRepositories();
    const mappedRepositories = new Map(
      repositories.map((repo) => {
        const mapped = this.mapRepository(repo);
        return [mapped.fullPath.toLowerCase(), mapped];
      })
    );

    if (this.sourcesCollection) {
      const publicSources = await this.sourcesCollection.find({ isPublicSource: true }).toArray();

      for (const source of publicSources) {
        const fullPath = `${source.space}/${source.name}`;
        mappedRepositories.set(fullPath.toLowerCase(), {
          provider: source.provider || 'github',
          id: source.sourceId || fullPath,
          space: source.space,
          name: source.name,
          fullPath,
          url: source.url || `https://github.com/${fullPath}`,
          defaultBranch: source.defaultBranch || 'main',
          isPrivate: false,
          updatedAt: source.updatedAt || '',
          description: source.description,
        });
      }
    }

    return [...mappedRepositories.values()];
  }

  async addPublicRepository(input: string): Promise<{
    repository: string;
    maxFiles: number;
    scanned: number;
    published: number;
  }> {
    if ((process.env.PROVIDER_TYPE || 'github') !== 'github') {
      throw new BadRequestError('Public repository registration currently supports GitHub only');
    }

    if (!this.sourcesCollection) {
      throw new Error('MongoDB source collection is not available');
    }

    const { space, name } = parseGithubRepositoryInput(input);
    const metadata = await this.vcsProvider.getRepository(space, name);
    if (metadata.isPrivate) {
      throw new BadRequestError('Only public repositories can be registered');
    }

    const fullName = `${space}/${name}`;
    await this.sourcesCollection.updateOne(
      { fullName },
      {
        $set: {
          sourceId: metadata.id,
          provider: 'github',
          fullName,
          space,
          name,
          url: metadata.url,
          defaultBranch: metadata.defaultBranch,
          isPrivate: false,
          isPublicSource: true,
          updatedAt: metadata.updatedAt,
          description: metadata.description,
        },
      },
      { upsert: true }
    );

    const maxFiles = getPublicRepositoryFileLimit();
    const result = await this.scanRepository(space, name, {
      branch: metadata.defaultBranch,
      maxFiles,
    });

    return { repository: fullName, maxFiles, ...result };
  }

  async scanRepository(
    space: string,
    name: string,
    options?: ScanRepositoryOptions
  ): Promise<{ scanned: number; published: number }> {
    let scanOptions = options;
    let isPublicSource = false;
    if (this.sourcesCollection && options?.maxFiles === undefined) {
      const publicSource = await this.sourcesCollection.findOne({
        fullName: `${space}/${name}`,
        isPublicSource: true,
      });
      if (publicSource) {
        isPublicSource = true;
        scanOptions = {
          ...options,
          maxFiles: Math.min(
            options?.maxFiles ?? getPublicRepositoryFileLimit(),
            MAX_PUBLIC_REPOSITORY_FILE_LIMIT
          ),
        };
      }
    } else if (options?.maxFiles !== undefined) {
      isPublicSource = Boolean(
        await this.sourcesCollection?.findOne({
          fullName: `${space}/${name}`,
          isPublicSource: true,
        })
      );
    }

    const syncResult = await this.scanAndPublishRepository(
      space,
      name,
      scanOptions,
      isPublicSource
    );

    const fullScan = !scanOptions?.pathPattern && scanOptions?.maxFiles === undefined;
    const completionEvent: CollectorRepositorySyncCompletedEvent = {
      eventType: 'collector.repository.sync.completed',
      provider: process.env.PROVIDER_TYPE || 'github',
      repository: syncResult.repository,
      branch: scanOptions?.branch,
      pathPattern: scanOptions?.pathPattern,
      fullScan,
      paths: syncResult.paths,
      collectedAt: new Date().toISOString(),
    };

    await this.eventBus.publish('collector.repository.sync.completed', completionEvent);

    return {
      scanned: syncResult.scanned,
      published: syncResult.published,
    };
  }

  async syncKnownRepositoriesOnStartup() {
    if (!this.sourcesCollection) {
      this.log.warn('collector: startup sync skipped, mongo source collection unavailable');
      return { attempted: 0, completed: 0, failed: 0 };
    }

    const sources = await this.sourcesCollection
      .find(
        {},
        {
          projection: {
            fullName: 1,
            space: 1,
            name: 1,
            defaultBranch: 1,
          },
        }
      )
      .toArray();

    if (sources.length === 0) {
      this.log.info('collector: no known repositories found for startup sync');
      return { attempted: 0, completed: 0, failed: 0 };
    }

    let completed = 0;
    let failed = 0;

    for (const source of sources) {
      const branch = source.defaultBranch || undefined;
      try {
        await this.scanRepository(source.space, source.name, { branch });
        completed += 1;
      } catch (error) {
        failed += 1;
        this.log.error(
          {
            error,
            repository: source.fullName,
          },
          'collector: startup sync failed for repository'
        );
      }
    }

    const summary = { attempted: sources.length, completed, failed };

    this.log.info(summary, 'collector: startup repository sync finished');
    return summary;
  }

  private async scanAndPublishRepository(
    space: string,
    name: string,
    options?: ScanRepositoryOptions,
    isPublicSource = false
  ): Promise<{
    repository: CollectorDocumentProcessedEvent['repository'];
    paths: string[];
    scanned: number;
    published: number;
  }> {
    this.log.info({ space, name, options }, 'collector: scanning repository');
    const repository = await this.vcsProvider.getRepository(space, name);
    if (isPublicSource && repository.isPrivate) {
      await this.sourcesCollection?.updateOne(
        { fullName: `${space}/${name}` },
        { $set: { isPrivate: true, isPublicSource: false } }
      );
      throw new BadRequestError('Registered repository is no longer public');
    }

    const files = await this.vcsProvider.listMarkdownFiles(space, name, {
      branch: options?.branch,
      pathPattern: options?.pathPattern,
      maxFiles: options?.maxFiles,
    });

    this.log.info(
      { repository: `${space}/${name}`, fileCount: files.length },
      'collector: found markdown files'
    );

    const processedDocuments = files.map((file) =>
      this.transformFile({
        provider: process.env.PROVIDER_TYPE || 'github',
        repository,
        file,
        space,
        name,
      })
    );

    await Promise.all(
      processedDocuments.map((document) =>
        this.eventBus.publish('collector.document.processed', document)
      )
    );

    return {
      repository: {
        id: repository.id,
        space,
        name,
        url: repository.url,
        defaultBranch: repository.defaultBranch,
        isPrivate: repository.isPrivate,
        updatedAt: repository.updatedAt,
      },
      paths: files.map((file) => file.path),
      scanned: files.length,
      published: processedDocuments.length,
    };
  }

  private mapRepository(repository: RepositoryMetadata): ScannableRepository {
    const { space, name } = this.extractNamespace(repository.id, repository.name);

    return {
      provider: process.env.PROVIDER_TYPE || 'github',
      id: repository.id,
      space,
      name,
      fullPath: `${space}/${name}`,
      url: repository.url,
      defaultBranch: repository.defaultBranch,
      isPrivate: repository.isPrivate,
      updatedAt: repository.updatedAt,
      description: repository.description,
    };
  }

  private extractNamespace(id: string, fallbackName: string): { space: string; name: string } {
    const segments = id.split('/').filter(Boolean);
    if (segments.length < 2) {
      return { space: 'default', name: fallbackName };
    }

    const name = segments[segments.length - 1];
    const space = segments.slice(0, -1).join('/');

    return { space, name };
  }

  private transformFile(input: {
    provider: string;
    repository: RepositoryMetadata;
    file: FileContent;
    space: string;
    name: string;
  }): CollectorDocumentProcessedEvent {
    const parsed = matter(input.file.content || '');

    return {
      eventType: 'collector.document.processed',
      provider: input.provider,
      repository: {
        id: input.repository.id,
        space: input.space,
        name: input.name,
        url: input.repository.url,
        defaultBranch: input.repository.defaultBranch,
        isPrivate: input.repository.isPrivate,
        updatedAt: input.repository.updatedAt,
      },
      document: {
        path: input.file.path,
        url: input.file.url,
        hash: input.file.hash,
        author: input.file.author,
        createdAt: input.file.createdAt,
        updatedAt: input.file.updatedAt,
        content: parsed.content,
        metadata: parsed.data || {},
      },
      collectedAt: new Date().toISOString(),
    };
  }
}

module.exports = {
  CollectorService,
};
