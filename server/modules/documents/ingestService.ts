import { FastifyInstance } from 'fastify';
import { Collection } from 'mongodb';
import { CollectorDocumentProcessedEvent } from '../collector/events';

type DocumentRecord = {
  sourceId: string;
  provider: string;
  repoFullName: string;
  space: string;
  name: string;
  path: string;
  url: string;
  hash: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  collectedAt: string;
  content: string;
  metadata: Record<string, unknown>;
  ingestedAt: string;
};

type DocumentSourceRecord = {
  sourceId: string;
  provider: string;
  fullName: string;
  space: string;
  name: string;
  url: string;
  defaultBranch: string;
  isPrivate: boolean;
  updatedAt: string;
  lastCollectedAt: string;
  lastIngestedAt: string;
  lastSyncStartedAt?: string;
  lastSyncCompletedAt?: string;
  lastSyncStatus?: 'running' | 'completed' | 'failed';
  lastSyncError?: string | null;
};

type KnownSourceRepository = {
  fullName: string;
  space: string;
  name: string;
  defaultBranch: string;
};

class DocumentsIngestService {
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

  async ensureIndexes() {
    await this.documentsCollection.createIndex({ repoFullName: 1, path: 1 }, { unique: true });
    await this.documentsCollection.createIndex({ sourceId: 1 });
    await this.documentsCollection.createIndex({ space: 1, name: 1 });
    await this.documentsCollection.createIndex(
      {
        content: 'text',
        path: 'text',
        'metadata.type': 'text',
        'metadata.tags': 'text',
        'metadata.author': 'text',
        'metadata.status': 'text',
        'metadata.priority': 'text',
      },
      {
        name: 'documents_fulltext_idx',
        weights: {
          content: 10,
          path: 6,
          'metadata.type': 4,
          'metadata.tags': 3,
          'metadata.author': 2,
          'metadata.status': 1,
          'metadata.priority': 1,
        },
      }
    );

    await this.sourcesCollection.createIndex({ fullName: 1 }, { unique: true });
    await this.sourcesCollection.createIndex({ sourceId: 1 });
  }

  async ingestProcessedDocument(event: CollectorDocumentProcessedEvent) {
    const repoFullName = `${event.repository.space}/${event.repository.name}`;
    const now = new Date().toISOString();

    await this.sourcesCollection.updateOne(
      { fullName: repoFullName },
      {
        $set: {
          sourceId: event.repository.id,
          provider: event.provider,
          fullName: repoFullName,
          space: event.repository.space,
          name: event.repository.name,
          url: event.repository.url,
          defaultBranch: event.repository.defaultBranch,
          isPrivate: event.repository.isPrivate,
          updatedAt: event.repository.updatedAt,
          lastCollectedAt: event.collectedAt,
          lastIngestedAt: now,
        },
      },
      { upsert: true }
    );

    await this.documentsCollection.updateOne(
      { repoFullName, path: event.document.path },
      {
        $set: {
          sourceId: event.repository.id,
          provider: event.provider,
          repoFullName,
          space: event.repository.space,
          name: event.repository.name,
          path: event.document.path,
          url: event.document.url,
          hash: event.document.hash,
          author: event.document.author,
          createdAt: event.document.createdAt,
          updatedAt: event.document.updatedAt,
          collectedAt: event.collectedAt,
          content: event.document.content,
          metadata: event.document.metadata || {},
          ingestedAt: now,
        },
      },
      { upsert: true }
    );
  }

  async listKnownSourceRepositories(): Promise<KnownSourceRepository[]> {
    return this.sourcesCollection
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
  }

  async markSourceSyncStarted(repoFullName: string) {
    const now = new Date().toISOString();

    await this.sourcesCollection.updateOne(
      { fullName: repoFullName },
      {
        $set: {
          lastSyncStartedAt: now,
          lastSyncStatus: 'running',
          lastSyncError: null,
        },
      }
    );
  }

  async markSourceSyncCompleted(repoFullName: string) {
    const now = new Date().toISOString();

    await this.sourcesCollection.updateOne(
      { fullName: repoFullName },
      {
        $set: {
          lastSyncCompletedAt: now,
          lastSyncStatus: 'completed',
          lastSyncError: null,
        },
      }
    );
  }

  async markSourceSyncFailed(repoFullName: string, errorMessage: string) {
    await this.sourcesCollection.updateOne(
      { fullName: repoFullName },
      {
        $set: {
          lastSyncStatus: 'failed',
          lastSyncError: errorMessage,
        },
      }
    );
  }

  async deleteMissingRepositoryDocuments(repoFullName: string, existingPaths: string[]) {
    const filter =
      existingPaths.length > 0
        ? {
            repoFullName,
            path: { $nin: existingPaths },
          }
        : { repoFullName };

    const result = await this.documentsCollection.deleteMany(filter);
    return result.deletedCount;
  }
}

export { DocumentsIngestService };
export type { CollectorDocumentProcessedEvent };
export type { DocumentRecord, DocumentSourceRecord };
