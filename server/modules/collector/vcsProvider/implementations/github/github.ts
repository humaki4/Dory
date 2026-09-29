import { Octokit } from '@octokit/rest';
import {
  IVcsProvider,
  RepositoryMetadata,
  FileContent,
  ListFilesOptions,
} from '../../IVcsProvider';

type GitHubRepositoryLike = {
  owner: { login: string };
  name: string;
  description: string | null;
  html_url: string;
  updated_at: string | null;
  default_branch: string;
  private: boolean;
};

export class GitHubProvider implements IVcsProvider {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async listRepositories(): Promise<RepositoryMetadata[]> {
    const fetchPage = async (page: number): Promise<RepositoryMetadata[]> => {
      const response = await this.octokit.repos.listForAuthenticatedUser({
        per_page: 100,
        page,
        type: 'all',
      });

      const currentRepos = response.data.map((ghRepo) => this.mapRepoMetadata(ghRepo));

      if (response.data.length < 100) {
        return currentRepos;
      }

      const nextRepos = await fetchPage(page + 1);
      return [...currentRepos, ...nextRepos];
    };

    return fetchPage(1);
  }

  async getRepository(owner: string, repo: string): Promise<RepositoryMetadata> {
    const response = await this.octokit.repos.get({ owner, repo });
    return this.mapRepoMetadata(response.data);
  }

  async listMarkdownFiles(
    owner: string,
    repo: string,
    options?: ListFilesOptions
  ): Promise<FileContent[]> {
    const branch = options?.branch || (await this.getDefaultBranch(owner, repo));

    const branchResponse = await this.octokit.repos.getBranch({ owner, repo, branch });
    const treeSha = branchResponse.data.commit.sha;

    const treeResponse = await this.octokit.git.getTree({
      owner,
      repo,
      tree_sha: treeSha,
      recursive: '1',
    });

    const mdFiles = treeResponse.data.tree
      .filter((node) => node.path?.endsWith('.md') && node.type === 'blob')
      .filter((node): node is typeof node & { path: string } => typeof node.path === 'string');

    const results = await Promise.allSettled(
      mdFiles.map((mdFile) => this.getFile(owner, repo, mdFile.path, branch))
    );

    const rejectedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    );

    if (rejectedResults.length > 0) {
      throw new Error(
        `Failed to fetch ${rejectedResults.length} markdown file(s) from ${owner}/${repo}`
      );
    }

    return results
      .filter(
        (result): result is PromiseFulfilledResult<FileContent> => result.status === 'fulfilled'
      )
      .map((result) => result.value);
  }

  async getFile(owner: string, repo: string, path: string, branch?: string): Promise<FileContent> {
    const ref = branch || (await this.getDefaultBranch(owner, repo));

    const fileResponse = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if (Array.isArray(fileResponse.data)) {
      throw new Error(`Path ${path} is a directory, not a file`);
    }

    if (fileResponse.data.type !== 'file') {
      throw new Error(`Path ${path} is not a regular file`);
    }

    const content = Buffer.from(fileResponse.data.content || '', 'base64').toString('utf-8');
    const fileUrl = fileResponse.data.html_url || '';

    const commitResponse = await this.octokit.repos.listCommits({
      owner,
      repo,
      path,
      ref,
      per_page: 1,
    });

    const commit = commitResponse.data[0];
    if (!commit) {
      throw new Error(`No commits found for ${path}`);
    }

    return {
      path,
      url: fileUrl,
      content,
      hash: commit.sha,
      updatedAt: commit.commit.committer?.date || new Date().toISOString(),
      createdAt: commit.commit.author?.date || new Date().toISOString(),
      author: commit.commit.author?.name || commit.author?.login || 'Unknown',
    };
  }

  private async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const response = await this.octokit.repos.get({ owner, repo });
    return response.data.default_branch || 'main';
  }

  private mapRepoMetadata(ghRepo: GitHubRepositoryLike): RepositoryMetadata {
    return {
      id: `${ghRepo.owner.login}/${ghRepo.name}`,
      name: ghRepo.name,
      description: ghRepo.description || undefined,
      url: ghRepo.html_url,
      updatedAt: ghRepo.updated_at || new Date().toISOString(),
      defaultBranch: ghRepo.default_branch || 'main',
      isPrivate: ghRepo.private,
    };
  }
}
