import { FastifyInstance } from 'fastify';
import { DocumentsBrowseService } from './browseService';
import { DocumentsIngestService } from './ingestService';
import routes from './routes';
import {
  CollectorDocumentProcessedEvent,
  CollectorRepositorySyncCompletedEvent,
} from '../collector/events';

export default async function (fastify: FastifyInstance) {
  const ingestService = new DocumentsIngestService(fastify);
  const browseService = new DocumentsBrowseService(fastify);

  await ingestService.ensureIndexes();

  fastify.register(routes, { service: browseService });

  fastify.eventBus.subscribe(
    'collector.document.processed',
    async (payload: CollectorDocumentProcessedEvent) => {
      fastify.log.info(
        {
          repository: payload.repository,
          document: payload.document,
        },
        'documents: received collector event'
      );
      try {
        await ingestService.ingestProcessedDocument(payload);
      } catch (error) {
        fastify.log.error(
          {
            error,
            repository: payload.repository,
            path: payload.document?.path,
          },
          'documents: failed to ingest collector event'
        );
      }
    }
  );

  fastify.eventBus.subscribe(
    'collector.repository.sync.completed',
    async (payload: CollectorRepositorySyncCompletedEvent) => {
      const repoFullName = `${payload.repository.space}/${payload.repository.name}`;

      try {
        await ingestService.markSourceSyncStarted(repoFullName);

        if (payload.fullScan) {
          const deletedCount = await ingestService.deleteMissingRepositoryDocuments(
            repoFullName,
            payload.paths
          );

          fastify.log.info(
            {
              repository: repoFullName,
              deletedCount,
              scannedCount: payload.paths.length,
            },
            'documents: synchronized repository deletions after full scan'
          );
        }

        await ingestService.markSourceSyncCompleted(repoFullName);
      } catch (error) {
        await ingestService.markSourceSyncFailed(
          repoFullName,
          error instanceof Error ? error.message : 'Unknown sync error'
        );

        fastify.log.error(
          {
            error,
            repository: repoFullName,
          },
          'documents: failed to finalize repository sync'
        );
      }
    }
  );

  fastify.log.info('documents: event listener registered');
}
