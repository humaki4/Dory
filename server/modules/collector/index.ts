import { FastifyInstance } from 'fastify';
import routes from './routes';
import vcsProvider from './vcsProvider';
import { CollectorService } from './service';

export default function (fastify: FastifyInstance) {
  fastify.register(vcsProvider);
  fastify.register(routes);

  fastify.addHook('onReady', async () => {
    if (process.env.COLLECTOR_STARTUP_SYNC_ENABLED === 'false') {
      fastify.log.info('collector: startup sync disabled by configuration');
      return;
    }

    setImmediate(async () => {
      const collectorService = new CollectorService(fastify);

      try {
        const summary = await collectorService.syncKnownRepositoriesOnStartup();
        fastify.log.info(summary, 'collector: startup sync completed');
      } catch (error) {
        fastify.log.error({ error }, 'collector: startup sync failed');
      }
    });
  });
}
