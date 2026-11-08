import fastify, { FastifyInstance, FastifyPluginCallback } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '../../core/errors';
import type { TypedAuthorizationRequest } from '../../plugins/repositoryAccess/types';
import type { FileContent, RepositoryMetadata } from './vcsProvider/IVcsProvider';
import type { CollectorDocumentProcessedEvent } from './events';
import type { DocAtlasEventMap } from '../../plugins/eventBus/types';
import type { LocalEventBus } from '../../plugins/eventBus/eventBus';

import collectorRoutes from './routes';
import { registerGlobalErrorHandlers } from '../../app';

async function buildCollectorTestApp(setup?: {
  repositories?: RepositoryMetadata[];
  repository?: RepositoryMetadata;
  files?: FileContent[];
  listRepositoriesError?: Error;
  scanError?: Error;
}) {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerGlobalErrorHandlers(app);

  const repositories =
    setup?.repositories ||
    ([
      {
        id: 'acme/docs',
        name: 'docs',
        url: 'https://example.com/acme/docs',
        updatedAt: '2026-01-01T00:00:00.000Z',
        defaultBranch: 'main',
        isPrivate: false,
      },
    ] satisfies RepositoryMetadata[]);

  const repository =
    setup?.repository ||
    ({
      id: 'acme/docs',
      name: 'docs',
      url: 'https://example.com/acme/docs',
      updatedAt: '2026-01-01T00:00:00.000Z',
      defaultBranch: 'main',
      isPrivate: false,
    } satisfies RepositoryMetadata);

  const files =
    setup?.files ||
    ([
      {
        path: 'README.md',
        url: 'https://example.com/acme/docs/README.md',
        content: '# Hello',
        hash: 'abc123',
        updatedAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        author: 'martina',
      },
    ] satisfies FileContent[]);

  const listRepositoriesMock = vi.fn(() => {
    if (setup?.listRepositoriesError) {
      throw setup.listRepositoriesError;
    }
    return Promise.resolve(repositories);
  });

  const getRepositoryMock = vi.fn(() => {
    if (setup?.scanError) {
      throw setup.scanError;
    }
    return Promise.resolve(repository);
  });

  const listMarkdownFilesMock = vi.fn(() => {
    if (setup?.scanError) {
      throw setup.scanError;
    }
    return Promise.resolve(files);
  });

  const publicSourceRecords: Array<Record<string, unknown>> = [];
  const publicSourceCollection = {
    find: vi.fn((filter: { isPublicSource?: boolean }) => ({
      toArray: async () =>
        publicSourceRecords.filter((source) => source.isPublicSource === filter.isPublicSource),
    })),
    findOne: vi.fn(
      async (filter: { fullName: string; isPublicSource?: boolean }) =>
        publicSourceRecords.find(
          (source) =>
            source.fullName === filter.fullName &&
            (!filter.isPublicSource || source.isPublicSource === filter.isPublicSource)
        ) || null
    ),
    updateOne: vi.fn(
      async (_filter: { fullName: string }, update: { $set: Record<string, unknown> }) => {
        publicSourceRecords.push({ ...update.$set });
        return { acknowledged: true };
      }
    ),
  };

  app.decorate('vcsProvider', {
    listRepositories: listRepositoriesMock,
    getRepository: getRepositoryMock,
    listMarkdownFiles: listMarkdownFilesMock,
    getFile: vi.fn(),
  });
  app.decorate('mongo', {
    db: {
      collection: vi.fn(() => publicSourceCollection),
    },
  } as unknown as FastifyInstance['mongo']);

  app.decorate('eventBus', {
    publish: vi.fn(
      (_eventName: keyof DocAtlasEventMap, _payload: CollectorDocumentProcessedEvent) =>
        Promise.resolve()
    ),
    subscribe: vi.fn(),
    clear: vi.fn(),
  } as unknown as LocalEventBus<DocAtlasEventMap>);

  app.decorate('authorize', async (_request, input: TypedAuthorizationRequest) => {
    if (input.action === 'administration:read' || input.action === 'administration:write') {
      return {};
    }

    throw new ForbiddenError('Unsupported test authorization action');
  });

  await app.register(collectorRoutes as FastifyPluginCallback, { prefix: '/api/collector' });
  await app.ready();

  return {
    app,
    mocks: {
      listMarkdownFilesMock,
      publicSourceRecords,
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('collector routes', () => {
  it('GET /api/collector/repositories returns provider and mapped repositories', async () => {
    const { app } = await buildCollectorTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/collector/repositories',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      provider: 'github',
      repositories: [
        {
          fullPath: 'acme/docs',
          space: 'acme',
          name: 'docs',
        },
      ],
    });

    await app.close();
  });

  it('GET /api/collector/repositories maps service errors to 500', async () => {
    const { app } = await buildCollectorTestApp({
      listRepositoriesError: new Error('provider unavailable'),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/collector/repositories',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal Server Error',
      requestId: expect.any(String),
    });

    await app.close();
  });

  it('POST /api/collector/repositories/public registers and scans a public repository', async () => {
    const { app, mocks } = await buildCollectorTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/collector/repositories/public',
      payload: { repository: 'https://github.com/acme/docs' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      provider: 'github',
      repository: 'acme/docs',
      maxFiles: 5,
      scanned: 1,
      published: 1,
    });
    expect(mocks.publicSourceRecords[0]).toMatchObject({
      fullName: 'acme/docs',
      isPublicSource: true,
    });

    await app.close();
  });

  it('POST /api/collector/repositories/public rejects private repositories', async () => {
    const { app, mocks } = await buildCollectorTestApp({
      repository: {
        id: 'acme/docs',
        name: 'docs',
        url: 'https://github.com/acme/docs',
        updatedAt: '2026-01-01T00:00:00.000Z',
        defaultBranch: 'main',
        isPrivate: true,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/collector/repositories/public',
      payload: { repository: 'acme/docs' },
    });

    expect(response.statusCode).toBe(400);
    expect(mocks.publicSourceRecords).toHaveLength(0);

    await app.close();
  });

  it('POST /api/collector/repositories/public rejects invalid repository input', async () => {
    const { app } = await buildCollectorTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/collector/repositories/public',
      payload: { repository: 'https://gitlab.com/acme/docs' },
    });

    expect(response.statusCode).toBe(400);

    await app.close();
  });

  it('POST /api/collector/repositories/:space/:name/scan returns scan result', async () => {
    const { app, mocks } = await buildCollectorTestApp({
      files: [
        {
          path: 'docs/a.md',
          url: 'https://example.com/acme/docs/docs/a.md',
          content: '# A',
          hash: 'hash-a',
          updatedAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          author: 'martina',
        },
        {
          path: 'docs/b.md',
          url: 'https://example.com/acme/docs/docs/b.md',
          content: '# B',
          hash: 'hash-b',
          updatedAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          author: 'martina',
        },
      ],
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/collector/repositories/acme/docs/scan?branch=develop&pathPattern=docs/**/*.md',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      provider: 'github',
      repository: 'acme/docs',
      scanned: 2,
      published: 2,
    });

    expect(mocks.listMarkdownFilesMock).toHaveBeenCalledWith('acme', 'docs', {
      branch: 'develop',
      pathPattern: 'docs/**/*.md',
    });

    await app.close();
  });

  it('POST /api/collector/repositories/:space/:name/scan maps service errors to 500', async () => {
    const { app } = await buildCollectorTestApp({
      scanError: new Error('scan failed'),
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/collector/repositories/acme/docs/scan',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal Server Error',
      requestId: expect.any(String),
    });

    await app.close();
  });
});
