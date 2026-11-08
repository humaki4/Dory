import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CollectorService } from './service';

export default function (fastify: FastifyInstance) {
  const collectorService = new CollectorService(fastify);

  const app = fastify.withTypeProvider<ZodTypeProvider>();

  const repositoryParamsSchema = z.object({
    space: z.string().min(1),
    name: z.string().min(1),
  });

  const publicRepositoryBodySchema = z.object({
    repository: z.string().min(1),
  });

  const scanQuerySchema = z.object({
    branch: z.string().min(1).optional(),
    pathPattern: z.string().min(1).optional(),
  });

  app.get('/repositories', async (request: FastifyRequest) => {
    await fastify.authorize(request, {
      action: 'administration:read',
      resource: { type: 'administration' },
    });

    const repositories = await collectorService.listScannableRepositories();

    return {
      provider: process.env.PROVIDER_TYPE || 'github',
      repositories,
    };
  });

  app.post(
    '/repositories/public',
    {
      schema: {
        body: publicRepositoryBodySchema,
      },
    },
    async (request) => {
      await fastify.authorize(request, {
        action: 'administration:write',
        resource: { type: 'administration' },
      });

      const result = await collectorService.addPublicRepository(request.body.repository);

      return {
        provider: 'github',
        ...result,
      };
    }
  );

  app.post(
    '/repositories/:space/:name/scan',
    {
      schema: {
        params: repositoryParamsSchema,
        querystring: scanQuerySchema,
      },
    },
    async (request) => {
      await fastify.authorize(request, {
        action: 'administration:write',
        resource: { type: 'administration' },
      });

      const { space, name } = request.params;
      const { branch, pathPattern } = request.query;

      // fastify.log.info(
      //   { request.params },
      //   'collector: scanning repository request'
      // );

      const result = await collectorService.scanRepository(space, name, { branch, pathPattern });

      return {
        provider: process.env.PROVIDER_TYPE || 'github',
        repository: `${space}/${name}`,
        ...result,
      };
    }
  );
}
