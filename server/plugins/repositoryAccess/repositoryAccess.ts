import fp from 'fastify-plugin';
import { FastifyPluginCallback, FastifyRequest } from 'fastify';
import { AuthorizationResultFor, TypedAuthorizationRequest } from './types';
import { createRepositoryAccessService } from './service';

declare module 'fastify' {
  interface FastifyInstance {
    authorize: <T extends TypedAuthorizationRequest>(
      request: FastifyRequest,
      input: T
    ) => Promise<AuthorizationResultFor<T>>;
  }
}

const repositoryAccessPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  const { authorize } = createRepositoryAccessService(fastify.log, (request, userSub) =>
    fastify.getGithubAccessTokenFromRequest(request, userSub)
  );

  fastify.decorate(
    'authorize',
    async (request: FastifyRequest, input: TypedAuthorizationRequest) => {
      return authorize(request, input);
    }
  );

  done();
};

export default fp(repositoryAccessPlugin);
