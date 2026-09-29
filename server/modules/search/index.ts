import { FastifyInstance } from 'fastify';
import routes from './routes';

export default function (fastify: FastifyInstance) {
  fastify.register(routes);
}
