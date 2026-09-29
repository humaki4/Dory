import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { DocumentsBrowseService } from './browseService';

type RoutesOptions = {
  service: DocumentsBrowseService;
};

export default function (fastify: FastifyInstance, opts: RoutesOptions) {
  const service = opts.service;

  const app = fastify.withTypeProvider<ZodTypeProvider>();

  const repositoryParamsSchema = z.object({
    space: z.string().min(1),
    name: z.string().min(1),
  });

  app.get('/', async (request: FastifyRequest) => {
    const { allowedRepositories } = await fastify.authorize(request, {
      action: 'repositories:list',
      resource: { type: 'repository-collection' },
    });

    return service.listRepositories(allowedRepositories);
  });

  app.get(
    '/content/:space/:name/*',
    {
      schema: {
        params: repositoryParamsSchema.extend({
          '*': z.string().optional(),
        }),
      },
    },
    async (request) => {
      const { space, name } = request.params;
      const path = request.params['*'] || '';
      await fastify.authorize(request, {
        action: 'repository:read',
        resource: { type: 'repository', fullName: `${space}/${name}` },
      });

      return service.getContent(space, name, path);
    }
  );

  app.get(
    '/content/:space/:name',
    {
      schema: {
        params: repositoryParamsSchema,
      },
    },
    async (request) => {
      const { space, name } = request.params;
      await fastify.authorize(request, {
        action: 'repository:read',
        resource: { type: 'repository', fullName: `${space}/${name}` },
      });

      return service.getContent(space, name, '');
    }
  );
}
