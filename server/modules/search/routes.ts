import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { MongoDBSearchService } from './mongoDbSearchService';

export default function (fastify: FastifyInstance) {
  const searchService = new MongoDBSearchService(fastify);

  const app = fastify.withTypeProvider<ZodTypeProvider>();

  const repositoryParamsSchema = z.object({
    space: z.string().min(1),
    name: z.string().min(1),
  });

  const searchQuerySchema = z.object({
    q: z.string().min(1),
  });

  const globalSearchQuerySchema = z.object({
    search: z.string().min(1),
  });

  app.get('/indexes', async (request: FastifyRequest) => {
    const { allowedRepositories } = await fastify.authorize(request, {
      action: 'repositories:list',
      resource: { type: 'repository-collection' },
    });

    return searchService.listIndexes(allowedRepositories);
  });

  app.get(
    '/:space/:name/stats',
    {
      schema: {
        params: repositoryParamsSchema,
      },
    },
    async (request) => {
      const { space, name } = request.params;
      const repoFullName = `${space}/${name}`;
      await fastify.authorize(request, {
        action: 'repository:read',
        resource: { type: 'repository', fullName: repoFullName },
      });

      return searchService.getRepositoryIndexStats(space, name);
    }
  );

  app.get(
    '/:space/:name',
    {
      schema: {
        params: repositoryParamsSchema,
        querystring: searchQuerySchema,
      },
    },
    async (request) => {
      const { space, name } = request.params;
      const query = request.query.q;
      const repoFullName = `${space}/${name}`;
      await fastify.authorize(request, {
        action: 'repository:read',
        resource: { type: 'repository', fullName: repoFullName },
      });

      return searchService.searchInRepository(space, name, query);
    }
  );

  app.get(
    '/:space',
    {
      schema: {
        params: z.object({
          space: z.string().min(1),
        }),
        querystring: searchQuerySchema,
      },
    },
    async (request) => {
      const { space } = request.params;
      const query = request.query.q;
      const { allowedRepositories } = await fastify.authorize(request, {
        action: 'repositories:list',
        resource: { type: 'repository-collection' },
      });

      return searchService.searchInSpace(space, query, allowedRepositories);
    }
  );

  app.get(
    '/',
    {
      schema: {
        querystring: globalSearchQuerySchema,
      },
    },
    async (request) => {
      const query = request.query.search;
      const { allowedRepositories } = await fastify.authorize(request, {
        action: 'repositories:list',
        resource: { type: 'repository-collection' },
      });

      return searchService.searchGlobal(query, allowedRepositories);
    }
  );
}
