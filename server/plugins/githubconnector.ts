import { Octokit } from '@octokit/rest';
import fp from 'fastify-plugin';
import { FastifyPluginCallback } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    githubClient: Octokit;
  }
}

const githubConnectorPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.log.info({ githubToken: process.env.GITHUB_TOKEN });
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  fastify.decorate('githubClient', octokit);
  done();
};

export default fp(githubConnectorPlugin);
