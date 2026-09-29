import { FastifyInstance } from 'fastify';
import { Collection, Document } from 'mongodb';
import type { DocumentRecord, DocumentSourceRecord } from '../documents/ingestService';

type MongoSearchHit = {
  id: string;
  source_id: string;
  repo_source_id: string;
  path: string;
  url: string;
  content: string;
  metadata: Record<string, unknown>;
  rankingScore: number;
};

type SearchAggregateRow = {
  sourceId: string;
  repoFullName: string;
  path: string;
  url: string;
  content: string;
  metadata: Record<string, unknown>;
  rankingScore?: number;
};

class MongoDBSearchService {
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

  private normalizeQuery(query: string) {
    return typeof query === 'string' ? query.trim() : '';
  }

  private createSearchFilter(
    query: string,
    scope?: { space?: string; name?: string },
    allowedRepoFullNames?: Set<string>
  ): Document | null {
    const normalized = this.normalizeQuery(query);
    if (!normalized) {
      return null;
    }

    const allowedRepos = Array.from(allowedRepoFullNames || []);
    if (!allowedRepos.length) {
      return null;
    }

    return {
      ...(scope?.space ? { space: scope.space } : {}),
      ...(scope?.name ? { name: scope.name } : {}),
      repoFullName: { $in: allowedRepos },
      $text: { $search: normalized },
    };
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private createRegexFilter(
    query: string,
    scope?: { space?: string; name?: string },
    allowedRepoFullNames?: Set<string>
  ): Document | null {
    const normalized = this.normalizeQuery(query);
    if (!normalized) {
      return null;
    }

    const allowedRepos = Array.from(allowedRepoFullNames || []);
    if (!allowedRepos.length) {
      return null;
    }

    const regex = new RegExp(this.escapeRegExp(normalized), 'i');

    return {
      ...(scope?.space ? { space: scope.space } : {}),
      ...(scope?.name ? { name: scope.name } : {}),
      repoFullName: { $in: allowedRepos },
      $or: [
        { content: regex },
        { path: regex },
        { 'metadata.type': regex },
        { 'metadata.tags': regex },
        { 'metadata.author': regex },
        { 'metadata.status': regex },
        { 'metadata.priority': regex },
      ],
    };
  }

  private mapRowsToHits(rows: SearchAggregateRow[]): MongoSearchHit[] {
    return rows.map((row) => {
      const baseMetadata = row.metadata ?? {};

      return {
        id: row.path,
        source_id: row.sourceId,
        repo_source_id: row.repoFullName,
        path: row.path,
        url: row.url,
        content: row.content,
        metadata: {
          ...baseMetadata,
          repo: row.repoFullName,
          path: row.path,
        },
        rankingScore: typeof row.rankingScore === 'number' ? row.rankingScore : 0,
      };
    });
  }

  private async runTextSearch(
    filter: Document,
    limit: number,
    context: string
  ): Promise<MongoSearchHit[]> {
    this.fastify.log.debug({ context, limit, filter }, 'mongo search: running text search');

    try {
      const rows = await this.documentsCollection
        .aggregate<SearchAggregateRow>([
          { $match: filter },
          { $addFields: { rankingScore: { $meta: 'textScore' } } },
          { $sort: { rankingScore: -1, updatedAt: -1 } },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              sourceId: 1,
              repoFullName: 1,
              path: 1,
              url: 1,
              content: 1,
              metadata: 1,
              rankingScore: 1,
            },
          },
        ])
        .toArray();

      this.fastify.log.info(
        { context, limit, hits: rows.length },
        'mongo search: text search completed'
      );

      return this.mapRowsToHits(rows);
    } catch (error) {
      this.fastify.log.error({ error, context, filter }, 'mongo search: text search failed');
      throw error;
    }
  }

  private async runRegexFallback(
    query: string,
    limit: number,
    scope?: { space?: string; name?: string },
    allowedRepoFullNames?: Set<string>
  ): Promise<MongoSearchHit[]> {
    const filter = this.createRegexFilter(query, scope, allowedRepoFullNames);
    if (!filter) {
      return [];
    }

    this.fastify.log.warn({ limit, scope }, 'mongo search: using regex fallback search');

    const rows = await this.documentsCollection
      .aggregate<SearchAggregateRow>([
        { $match: filter },
        { $sort: { updatedAt: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            sourceId: 1,
            repoFullName: 1,
            path: 1,
            url: 1,
            content: 1,
            metadata: 1,
          },
        },
      ])
      .toArray();

    this.fastify.log.warn(
      { limit, scope, hits: rows.length },
      'mongo search: regex fallback completed'
    );

    return this.mapRowsToHits(rows);
  }

  async searchInRepository(space: string, name: string, query: string) {
    const filter = this.createSearchFilter(query, { space, name }, new Set([`${space}/${name}`]));
    if (!filter) {
      this.fastify.log.debug({ space, name, query }, 'mongo search: repository query is empty');
      return [];
    }

    return await this.runTextSearch(filter, 20, 'repository');
  }

  async searchInSpace(space: string, query: string, allowedRepoFullNames: Set<string>) {
    const filter = this.createSearchFilter(query, { space }, allowedRepoFullNames);
    if (!filter) {
      this.fastify.log.debug({ space, query }, 'mongo search: space query is empty');
      return [];
    }

    return await this.runTextSearch(filter, 100, 'space');
  }

  async searchGlobal(query: string, allowedRepoFullNames: Set<string>) {
    const filter = this.createSearchFilter(query, undefined, allowedRepoFullNames);
    if (!filter) {
      this.fastify.log.debug({ query }, 'mongo search: global query is empty');
      return [];
    }

    this.fastify.log.info({ query }, 'mongo search: global search started');

    const hits = await this.runTextSearch(filter, 120, 'global');
    if (hits.length > 0) {
      return hits;
    }

    const totalDocuments = await this.documentsCollection.countDocuments({});
    this.fastify.log.warn(
      { query, totalDocuments },
      'mongo search: global text search returned no hits, attempting regex fallback'
    );

    return await this.runRegexFallback(query, 120, undefined, allowedRepoFullNames);
  }

  async getRepositoryIndexStats(space: string, name: string) {
    const repoFullName = `${space}/${name}`;
    const numberOfDocuments = await this.documentsCollection.countDocuments({ repoFullName });
    const contentDocuments = await this.documentsCollection.countDocuments({
      repoFullName,
      content: { $type: 'string', $ne: '' },
    });
    const metadataDocuments = await this.documentsCollection.countDocuments({
      repoFullName,
      metadata: { $exists: true, $type: 'object' },
    });

    return {
      indexUid: `repo_${space}_${name}`.replace('/', '_'),
      numberOfDocuments,
      isIndexing: false,
      fieldDistribution: {
        path: numberOfDocuments,
        content: contentDocuments,
        metadata: metadataDocuments,
      },
    };
  }

  async listIndexes(allowedRepoFullNames: Set<string>) {
    const allowedRepos = Array.from(allowedRepoFullNames);
    if (!allowedRepos.length) {
      return {
        results: [],
        offset: 0,
        limit: 0,
        total: 0,
      };
    }

    const grouped = await this.documentsCollection
      .aggregate<{
        _id: { space: string; name: string; repoFullName: string };
        numberOfDocuments: number;
        updatedAt?: string;
      }>([
        {
          $match: {
            repoFullName: { $in: allowedRepos },
          },
        },
        {
          $group: {
            _id: { space: '$space', name: '$name', repoFullName: '$repoFullName' },
            numberOfDocuments: { $sum: 1 },
            updatedAt: { $max: '$updatedAt' },
          },
        },
        { $sort: { '_id.repoFullName': 1 } },
      ])
      .toArray();

    const sourceByFullName = new Map<string, DocumentSourceRecord>();
    const sources = await this.sourcesCollection
      .find({ fullName: { $in: allowedRepos } })
      .toArray();
    sources.forEach((source) => sourceByFullName.set(source.fullName, source));

    const results = grouped.map((row) => {
      const indexUid = `repo_${row._id.space}_${row._id.name}`.replace('/', '_');
      const source = sourceByFullName.get(row._id.repoFullName);

      return {
        uid: indexUid,
        primaryKey: 'path',
        repoFullName: row._id.repoFullName,
        sourceId: source?.sourceId,
        numberOfDocuments: row.numberOfDocuments,
        createdAt: source?.lastIngestedAt ?? source?.updatedAt,
        updatedAt: row.updatedAt ?? source?.updatedAt,
      };
    });

    return {
      results,
      offset: 0,
      limit: results.length,
      total: results.length,
    };
  }
}

export { MongoDBSearchService };
