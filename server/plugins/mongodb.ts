import fp from 'fastify-plugin';
import { FastifyPluginCallback } from 'fastify';
import mongodb from '@fastify/mongodb';

const mongodbPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.register(mongodb, {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/docatlas',
  });
  done();
};

export default fp(mongodbPlugin);
