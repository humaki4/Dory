import fp from 'fastify-plugin';
import { FastifyPluginCallback } from 'fastify';

import { LocalEventBus } from './eventBus';
import { DocAtlasEventMap } from './types';

declare module 'fastify' {
  interface FastifyInstance {
    eventBus: LocalEventBus<DocAtlasEventMap>;
  }
}

const eventBusPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  const eventBus = new LocalEventBus<DocAtlasEventMap>(fastify.log);
  fastify.decorate('eventBus', eventBus);
  done();
};

export default fp(eventBusPlugin);
