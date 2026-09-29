import matter from 'gray-matter';

import { FastifyInstance } from 'fastify';
import { Collection } from 'mongodb';
import { FileContent, RepositoryMetadata } from './vcsProvider/IVcsProvider';
import { CollectorDocumentProcessedEvent, CollectorRepositorySyncCompletedEvent } from './events';

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
}

type SourceSyncRepositoryRecord = {
  fullName: string;
  space: string;
  name: string;
  defaultBranch?: string;
};

type CollectorServiceContext = Pick<FastifyInstance, 'vcsProvider' | 'eventBus' | 'log' | 'mongo'>;

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

    return repositories.map((repo) => this.mapRepository(repo));
  }

  async scanRepository(
    space: string,
    name: string,
    options?: ScanRepositoryOptions
  ): Promise<{ scanned: number; published: number }> {
    const syncResult = await this.scanAndPublishRepository(space, name, options);

    const fullScan = !options?.pathPattern;
    const completionEvent: CollectorRepositorySyncCompletedEvent = {
      eventType: 'collector.repository.sync.completed',
      provider: process.env.PROVIDER_TYPE || 'github',
      repository: syncResult.repository,
      branch: options?.branch,
      pathPattern: options?.pathPattern,
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
    options?: ScanRepositoryOptions
  ): Promise<{
    repository: CollectorDocumentProcessedEvent['repository'];
    paths: string[];
    scanned: number;
    published: number;
  }> {
    this.log.info({ space, name, options }, 'collector: scanning repository');
    const repository = await this.vcsProvider.getRepository(space, name);
    const files = await this.vcsProvider.listMarkdownFiles(space, name, {
      branch: options?.branch,
      pathPattern: options?.pathPattern,
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
