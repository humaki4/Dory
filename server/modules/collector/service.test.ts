import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { FastifyBaseLogger, FastifyInstance } from 'fastify';

import { CollectorService } from './service';
import { FileContent, RepositoryMetadata } from './vcsProvider/IVcsProvider';
import type { CollectorDocumentProcessedEvent } from './events';
import type { DocAtlasEventMap } from '../../plugins/eventBus/types';
import type { LocalEventBus } from '../../plugins/eventBus/eventBus';

type CollectorServiceDependencies = Pick<FastifyInstance, 'vcsProvider' | 'eventBus' | 'log'> & {
  mocks: {
    listRepositories: ReturnType<typeof vi.fn>;
    getRepository: ReturnType<typeof vi.fn>;
    listMarkdownFiles: ReturnType<typeof vi.fn>;
    publish: ReturnType<typeof vi.fn>;
  };
};

function createFastifyMock(overrides?: {
  repositories?: RepositoryMetadata[];
  repository?: RepositoryMetadata;
  files?: FileContent[];
  listRepositoriesError?: Error;
  getRepositoryError?: Error;
  listMarkdownFilesError?: Error;
  publishError?: Error;
}) {
  const repositories =
    overrides?.repositories ||
    ([
      {
        id: 'acme/docs',
        name: 'docs',
        description: 'Docs repository',
        url: 'https://example.com/acme/docs',
        updatedAt: '2026-01-01T00:00:00.000Z',
        defaultBranch: 'main',
        isPrivate: false,
      },
    ] satisfies RepositoryMetadata[]);

  const repository =
    overrides?.repository ||
    ({
      id: 'acme/docs',
      name: 'docs',
      description: 'Docs repository',
      url: 'https://example.com/acme/docs',
      updatedAt: '2026-01-01T00:00:00.000Z',
      defaultBranch: 'main',
      isPrivate: false,
    } satisfies RepositoryMetadata);

  const files =
    overrides?.files ||
    ([
      {
        path: 'README.md',
        url: 'https://example.com/acme/docs/README.md',
        content: '---\ntitle: Welcome\ncategory: intro\n---\n# Hello',
        hash: 'abc123',
        updatedAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2025-12-31T00:00:00.000Z',
        author: 'martina',
      },
    ] satisfies FileContent[]);

  const listRepositories = vi.fn(() => {
    if (overrides?.listRepositoriesError) {
      throw overrides.listRepositoriesError;
    }
    return Promise.resolve(repositories);
  });

  const getRepository = vi.fn(() => {
    if (overrides?.getRepositoryError) {
      throw overrides.getRepositoryError;
    }
    return Promise.resolve(repository);
  });

  const listMarkdownFiles = vi.fn(() => {
    if (overrides?.listMarkdownFilesError) {
      throw overrides.listMarkdownFilesError;
    }
    return Promise.resolve(files);
  });

  const publish = vi.fn(() => {
    if (overrides?.publishError) {
      throw overrides.publishError;
    }
    return Promise.resolve();
  });

  return {
    log: {
      info: vi.fn(),
    } as unknown as FastifyBaseLogger,
    vcsProvider: {
      listRepositories,
      getRepository,
      listMarkdownFiles,
      getFile: vi.fn(),
    },
    eventBus: {
      publish,
      subscribe: vi.fn(),
      clear: vi.fn(),
    } as unknown as LocalEventBus<DocAtlasEventMap>,
    mocks: {
      listRepositories,
      getRepository,
      listMarkdownFiles,
      publish,
    },
  } as CollectorServiceDependencies;
}

function getPublishedPayloads(dependencies: CollectorServiceDependencies) {
  return dependencies.mocks.publish.mock.calls
    .filter((call) => call[0] === 'collector.document.processed')
    .map((call) => call[1] as CollectorDocumentProcessedEvent);
}

describe('CollectorService.listScannableRepositories', () => {
  const originalProviderType = process.env.PROVIDER_TYPE;

  beforeEach(() => {
    process.env.PROVIDER_TYPE = 'github';
  });

  afterEach(() => {
    process.env.PROVIDER_TYPE = originalProviderType;
  });

  it('maps provider repositories into scannable repositories', async () => {
    const dependencies = createFastifyMock({
      repositories: [
        {
          id: 'team/content',
          name: 'content',
          description: 'Content repo',
          url: 'https://example.com/team/content',
          updatedAt: '2026-01-20T10:00:00.000Z',
          defaultBranch: 'main',
          isPrivate: true,
        },
      ],
    });
    const service = new CollectorService(dependencies);

    const result = await service.listScannableRepositories();

    expect(dependencies.mocks.listRepositories).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        provider: 'github',
        id: 'team/content',
        space: 'team',
        name: 'content',
        fullPath: 'team/content',
        url: 'https://example.com/team/content',
        defaultBranch: 'main',
        isPrivate: true,
        updatedAt: '2026-01-20T10:00:00.000Z',
        description: 'Content repo',
      },
    ]);
  });

  it('supports nested namespaces', async () => {
    const dependencies = createFastifyMock({
      repositories: [
        {
          id: 'group/subgroup/knowledge-base',
          name: 'knowledge-base',
          url: 'https://example.com/group/subgroup/knowledge-base',
          updatedAt: '2026-01-01T00:00:00.000Z',
          defaultBranch: 'main',
          isPrivate: false,
        },
      ],
    });
    const service = new CollectorService(dependencies);

    const result = await service.listScannableRepositories();

    expect(result[0]).toMatchObject({
      space: 'group/subgroup',
      name: 'knowledge-base',
      fullPath: 'group/subgroup/knowledge-base',
    });
  });

  it('falls back to default namespace when id is malformed', async () => {
    const dependencies = createFastifyMock({
      repositories: [
        {
          id: 'orphan-repository-id',
          name: 'fallback-name',
          url: 'https://example.com/orphan-repository-id',
          updatedAt: '2026-01-01T00:00:00.000Z',
          defaultBranch: 'main',
          isPrivate: false,
        },
      ],
    });
    const service = new CollectorService(dependencies);

    const result = await service.listScannableRepositories();

    expect(result[0]).toMatchObject({
      space: 'default',
      name: 'fallback-name',
      fullPath: 'default/fallback-name',
    });
  });

  it('returns an empty list when provider has no repositories', async () => {
    const dependencies = createFastifyMock({ repositories: [] });
    const service = new CollectorService(dependencies);

    const result = await service.listScannableRepositories();

    expect(result).toEqual([]);
  });
});

describe('CollectorService.scanRepository', () => {
  const originalProviderType = process.env.PROVIDER_TYPE;

  beforeEach(() => {
    process.env.PROVIDER_TYPE = 'github';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-28T12:00:00.000Z'));
  });

  afterEach(() => {
    process.env.PROVIDER_TYPE = originalProviderType;
    vi.useRealTimers();
  });

  it('publishes one processed event per markdown file and returns counts', async () => {
    const dependencies = createFastifyMock({
      files: [
        {
          path: 'README.md',
          url: 'https://example.com/acme/docs/README.md',
          content: '---\ntitle: Welcome\n---\n# Hello',
          hash: 'hash1',
          updatedAt: '2026-01-02T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          author: 'alice',
        },
        {
          path: 'docs/guide.md',
          url: 'https://example.com/acme/docs/docs/guide.md',
          content: '# Guide',
          hash: 'hash2',
          updatedAt: '2026-01-03T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          author: 'bob',
        },
      ],
    });
    const service = new CollectorService(dependencies);

    const result = await service.scanRepository('acme', 'docs', {
      branch: 'develop',
      pathPattern: 'docs/**/*.md',
    });

    expect(dependencies.mocks.getRepository).toHaveBeenCalledWith('acme', 'docs');
    expect(dependencies.mocks.listMarkdownFiles).toHaveBeenCalledWith('acme', 'docs', {
      branch: 'develop',
      pathPattern: 'docs/**/*.md',
    });

    expect(dependencies.mocks.publish).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ scanned: 2, published: 2 });
  });

  it('parses frontmatter and plain markdown content correctly', async () => {
    const dependencies = createFastifyMock({
      files: [
        {
          path: 'with-frontmatter.md',
          url: 'https://example.com/acme/docs/with-frontmatter.md',
          content: '---\ntitle: Intro\nowner: docs-team\n---\nBody',
          hash: 'hash-frontmatter',
          updatedAt: '2026-01-03T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          author: 'martina',
        },
        {
          path: 'without-frontmatter.md',
          url: 'https://example.com/acme/docs/without-frontmatter.md',
          content: '# Plain document',
          hash: 'hash-plain',
          updatedAt: '2026-01-03T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          author: 'martina',
        },
      ],
    });
    const service = new CollectorService(dependencies);

    await service.scanRepository('acme', 'docs');

    const [firstCallPayload, secondCallPayload] = getPublishedPayloads(dependencies);

    expect(firstCallPayload.document.metadata).toEqual({ title: 'Intro', owner: 'docs-team' });
    expect(firstCallPayload.document.content.trim()).toBe('Body');
    expect(secondCallPayload.document.metadata).toEqual({});
    expect(secondCallPayload.document.content).toBe('# Plain document');
    expect(firstCallPayload.collectedAt).toBe('2026-02-28T12:00:00.000Z');
  });

  it('handles empty file content as empty markdown', async () => {
    const dependencies = createFastifyMock({
      files: [
        {
          path: 'empty.md',
          url: 'https://example.com/acme/docs/empty.md',
          content: '',
          hash: 'hash-empty',
          updatedAt: '2026-01-03T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          author: 'martina',
        },
      ],
    });
    const service = new CollectorService(dependencies);

    await service.scanRepository('acme', 'docs');

    const [payload] = getPublishedPayloads(dependencies);
    expect(payload.document.content).toBe('');
    expect(payload.document.metadata).toEqual({});
  });

  it('propagates provider errors', async () => {
    const dependencies = createFastifyMock({
      getRepositoryError: new Error('repository unavailable'),
    });
    const service = new CollectorService(dependencies);

    await expect(service.scanRepository('acme', 'docs')).rejects.toThrow('repository unavailable');
    expect(dependencies.mocks.publish).not.toHaveBeenCalled();
  });

  it('propagates publish errors', async () => {
    const dependencies = createFastifyMock({ publishError: new Error('event bus down') });
    const service = new CollectorService(dependencies);

    await expect(service.scanRepository('acme', 'docs')).rejects.toThrow('event bus down');
    expect(dependencies.mocks.publish).toHaveBeenCalledTimes(1);
  });
});
