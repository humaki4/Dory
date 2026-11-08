import { describe, expect, it, vi } from 'vitest';
import { GitHubProvider } from './github';

vi.mock('@octokit/rest', () => ({
  Octokit: class {},
}));

function createProvider(tree: Array<{ path: string; type: string }>, truncated = false) {
  const provider = new GitHubProvider('token');
  const octokit = {
    repos: {
      getBranch: vi.fn().mockResolvedValue({ data: { commit: { sha: 'tree-sha' } } }),
    },
    git: {
      getTree: vi.fn().mockResolvedValue({ data: { tree, truncated } }),
    },
  };

  (provider as unknown as { octokit: typeof octokit }).octokit = octokit;

  return { provider, octokit };
}

describe('GitHubProvider.listMarkdownFiles', () => {
  it('limits concurrent markdown file requests', async () => {
    const tree = Array.from({ length: 150 }, (_, index) => ({
      path: `docs/${index}.md`,
      type: 'blob',
    }));
    const { provider, octokit } = createProvider(tree);
    let activeRequests = 0;
    let maximumConcurrentRequests = 0;
    const getFile = vi
      .spyOn(provider, 'getFile')
      .mockImplementation(async (_owner, _repo, path) => {
        activeRequests += 1;
        maximumConcurrentRequests = Math.max(maximumConcurrentRequests, activeRequests);
        await Promise.resolve();
        activeRequests -= 1;
        return {
          path,
          url: `https://github.com/acme/docs/blob/main/${path}`,
          content: '# Doc',
          hash: 'sha',
          updatedAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          author: 'author',
        };
      });

    const result = await provider.listMarkdownFiles('acme', 'docs', {
      branch: 'main',
      maxFiles: 100,
    });

    expect(result).toHaveLength(100);
    expect(getFile).toHaveBeenCalledTimes(100);
    expect(maximumConcurrentRequests).toBe(5);
    expect(octokit.git.getTree).toHaveBeenCalledWith({
      owner: 'acme',
      repo: 'docs',
      tree_sha: 'tree-sha',
      recursive: '1',
    });
  });

  it('fails clearly when GitHub truncates the repository tree', async () => {
    const { provider } = createProvider([], true);

    await expect(
      provider.listMarkdownFiles('acme', 'large-docs', { branch: 'main' })
    ).rejects.toThrow('GitHub returned a truncated file tree for acme/large-docs');
  });
});
