import { describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { DocumentsBrowseService } from './browseService';

describe('DocumentsBrowseService.getContent', () => {
  it('finds imported repository documents regardless of owner casing', async () => {
    const document = {
      repoFullName: 'tanstack/query',
      path: 'README.md',
      content: '# TanStack Query',
      metadata: {},
      url: 'https://github.com/TanStack/query/blob/main/README.md',
      updatedAt: '2026-10-29T20:00:05Z',
    };
    const findOne = vi.fn(async (filter: { repoFullName: RegExp; path: string }) =>
      filter.repoFullName.test(document.repoFullName) && filter.path === document.path
        ? document
        : null
    );
    const documentsCollection = {
      findOne,
      find: vi.fn(() => ({ toArray: async () => [] })),
    };
    const sourcesCollection = {
      aggregate: vi.fn(() => ({ toArray: async () => [] })),
    };
    const fastify = {
      mongo: {
        db: {
          collection: vi.fn((name: string) =>
            name === 'documents2' ? documentsCollection : sourcesCollection
          ),
        },
      },
      log: { info: vi.fn() },
    } as unknown as FastifyInstance;
    const service = new DocumentsBrowseService(fastify);

    const result = await service.getContent('TanStack', 'query', 'README.md');

    expect(result).toMatchObject({
      repoFullName: 'tanstack/query',
      path: 'README.md',
      content: '# TanStack Query',
    });
    expect(findOne.mock.calls[0][0].repoFullName.test('tanstack/query')).toBe(true);
  });
});
