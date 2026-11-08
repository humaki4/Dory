import { FastifyInstance } from 'fastify';
import { Collection } from 'mongodb';
import type { DocumentRecord, DocumentSourceRecord } from './ingestService';

class DocumentsBrowseService {
  private readonly documentsCollection: Collection<DocumentRecord>;
  private readonly sourcesCollection: Collection<DocumentSourceRecord>;

  constructor(private readonly fastify: FastifyInstance) {
    const mongoDb = this.fastify.mongo?.db;
    if (!mongoDb) {
      throw new Error('MongoDB database is not available');
    }

    this.documentsCollection = mongoDb.collection<DocumentRecord>('documents2');
    this.sourcesCollection = mongoDb.collection<DocumentSourceRecord>('document_sources2');
  }

  async listRepositories(allowedRepoFullNames: Set<string>) {
    const allowedRepos = Array.from(allowedRepoFullNames).map((repo) => repo.toLowerCase());
    if (!allowedRepos.length) {
      this.fastify.log.info('documents: no allowed repositories for current user');
      return [];
    }

    const repositories = await this.sourcesCollection
      .aggregate<DocumentSourceRecord>([
        {
          $addFields: {
            fullNameLower: { $toLower: '$fullName' },
          },
        },
        {
          $match: {
            fullNameLower: { $in: allowedRepos },
          },
        },
        {
          $project: {
            fullNameLower: 0,
          },
        },
        {
          $sort: { fullName: 1 },
        },
      ])
      .toArray();

    this.fastify.log.info(
      {
        allowedRepoCount: allowedRepos.length,
        visibleRepoCount: repositories.length,
      },
      'documents: resolved visible repositories for user'
    );

    return repositories;
  }

  async getContent(space: string, name: string, path: string) {
    const repoFullName = `${space}/${name}`;
    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const repoFullNameRegex = new RegExp(`^${escapeRegExp(repoFullName)}$`, 'i');
    const normalizedPath = path.replace(/\/+$/, '');

    const fileDoc = await this.documentsCollection.findOne({
      repoFullName: repoFullNameRegex,
      path: normalizedPath || path,
    });

    if (fileDoc) {
      return fileDoc;
    }

    const prefix = normalizedPath ? `${normalizedPath}/` : '';
    const prefixRegex = new RegExp(`^${escapeRegExp(prefix)}`);

    const candidates = await this.documentsCollection
      .find({ repoFullName: repoFullNameRegex, path: prefixRegex })
      .toArray();

    if (!candidates.length) {
      throw new Error('File not found');
    }

    const immediateChildren = candidates.filter((doc) => {
      if (!doc.path.startsWith(prefix)) return false;
      const rest = doc.path.slice(prefix.length);
      return rest.length > 0 && !rest.includes('/');
    });

    const files = immediateChildren.map((doc) => ({
      path: doc.path,
      name: doc.path.split('/').pop(),
      metadata: doc.metadata,
      url: doc.url,
      updatedAt: doc.updatedAt,
    }));

    const directories = candidates
      .map((doc) => doc.path.slice(prefix.length))
      .filter((rest) => rest.includes('/'))
      .map((rest) => rest.split('/')[0])
      .filter((value, index, self) => self.indexOf(value) === index)
      .map((dir) => ({
        path: `${prefix}${dir}`,
        name: dir,
      }));

    const indexPath = prefix ? `${prefix}index.md` : 'index.md';
    const indexFile = candidates.find((doc) => doc.path === indexPath);

    const tagSet = new Set<string>();
    const typeSet = new Set<string>();

    for (const doc of candidates) {
      const tags = Array.isArray(doc.metadata?.tags)
        ? doc.metadata.tags.filter((tag): tag is string => typeof tag === 'string')
        : [];
      const type = typeof doc.metadata?.type === 'string' ? doc.metadata.type : undefined;
      tags.forEach((tag) => tagSet.add(tag));
      if (type) typeSet.add(type);
    }

    return {
      kind: 'directory',
      path: normalizedPath,
      files,
      directories,
      index: indexFile
        ? {
            path: indexFile.path,
            content: indexFile.content,
            metadata: indexFile.metadata,
            url: indexFile.url,
          }
        : null,
      tags: Array.from(tagSet),
      types: Array.from(typeSet),
    };
  }
}

export { DocumentsBrowseService };
