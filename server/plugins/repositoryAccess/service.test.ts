import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyBaseLogger, FastifyRequest } from 'fastify';
import {
  hasGithubRepositoryAccess,
  loadGithubAuthenticatedUser,
  loadGithubRepositories,
} from './github';
import { createRepositoryAccessService } from './service';

vi.mock('./github', () => ({
  hasGithubRepositoryAccess: vi.fn(),
  loadGithubAuthenticatedUser: vi.fn(),
  loadGithubRepositories: vi.fn(),
}));

function createRequest(provider = 'github') {
  return {
    currentUser: {
      sub: 'user-1',
      provider,
      roles: ['viewer'],
    },
  } as unknown as FastifyRequest;
}

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as FastifyBaseLogger;
}

describe('repository access for registered public sources', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(loadGithubAuthenticatedUser).mockResolvedValue(null);
    vi.mocked(loadGithubRepositories).mockResolvedValue(new Set());
    vi.mocked(hasGithubRepositoryAccess).mockResolvedValue(false);
  });

  it('allows public sources without a personal GitHub token', async () => {
    const service = createRepositoryAccessService(
      createLogger(),
      () => null,
      async () => new Set(['Acme/Docs'])
    );

    const result = await service.authorize(createRequest(), {
      action: 'repositories:list',
      resource: { type: 'repository-collection' },
    });

    expect(result.allowedRepositories).toEqual(new Set(['Acme/Docs', 'acme/docs']));
    expect(loadGithubRepositories).not.toHaveBeenCalled();
  });

  it('allows public sources for authenticated users from other providers', async () => {
    const service = createRepositoryAccessService(
      createLogger(),
      () => null,
      async () => new Set(['acme/docs'])
    );

    const result = await service.authorize(createRequest('gitlab'), {
      action: 'repositories:list',
      resource: { type: 'repository-collection' },
    });

    expect(result.allowedRepositories.has('acme/docs')).toBe(true);
  });

  it('falls back to public sources when GitHub permission lookup fails', async () => {
    vi.mocked(loadGithubRepositories).mockRejectedValue(new Error('bad credentials'));
    const service = createRepositoryAccessService(
      createLogger(),
      () => 'invalid-token',
      async () => new Set(['acme/docs'])
    );

    const result = await service.authorize(createRequest(), {
      action: 'repositories:list',
      resource: { type: 'repository-collection' },
    });

    expect(result.allowedRepositories.has('acme/docs')).toBe(true);
    expect(result.allowedRepositories.has('private/repo')).toBe(false);
  });

  it('continues to deny private repositories without verified access', async () => {
    vi.mocked(loadGithubRepositories).mockRejectedValue(new Error('bad credentials'));
    const service = createRepositoryAccessService(
      createLogger(),
      () => 'invalid-token',
      async () => new Set(['acme/docs'])
    );

    await expect(
      service.authorize(createRequest(), {
        action: 'repository:read',
        resource: { type: 'repository', fullName: 'private/repo' },
      })
    ).rejects.toThrow('No access to this repository');
  });
});
