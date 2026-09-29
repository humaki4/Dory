import {
  FileContent,
  IVcsProvider,
  ListFilesOptions,
  RepositoryMetadata,
} from '../../IVcsProvider';
import type { GitLabFile, GitLabProject, GitLabTreeNode, GitLabCommit } from './types';

export class GitLabProvider implements IVcsProvider {
  private readonly token: string;
  private readonly baseUrl: string;

  constructor(token: string, baseUrl?: string) {
    this.token = token;
    this.baseUrl = (baseUrl || process.env.GITLAB_BASE_URL || 'https://gitlab.com').replace(
      /\/+$/,
      ''
    );
  }

  async listRepositories(): Promise<RepositoryMetadata[]> {
    const repos: RepositoryMetadata[] = [];
    let page = 1;

    while (true) {
      const url = new URL(`${this.baseUrl}/api/v4/projects`);
      url.searchParams.set('membership', 'true');
      url.searchParams.set('simple', 'true');
      url.searchParams.set('per_page', '100');
      url.searchParams.set('page', String(page));
      url.searchParams.set('order_by', 'last_activity_at');
      url.searchParams.set('sort', 'desc');

      const response = await fetch(url.toString(), { headers: this.headers() });
      if (!response.ok) {
        throw new Error(`GitLab listRepositories failed (${response.status})`);
      }

      const payload = (await response.json()) as GitLabProject[];
      repos.push(...payload.map((project) => this.mapRepoMetadata(project)));

      const nextPage = response.headers.get('x-next-page');
      if (!nextPage) {
        break;
      }

      const parsed = Number(nextPage);
      page = Number.isNaN(parsed) ? page + 1 : parsed;
    }

    return repos;
  }

  async getRepository(owner: string, repo: string): Promise<RepositoryMetadata> {
    const project = await this.getProject(owner, repo);
    return this.mapRepoMetadata(project);
  }

  async listMarkdownFiles(
    owner: string,
    repo: string,
    options?: ListFilesOptions
  ): Promise<FileContent[]> {
    const project = await this.getProject(owner, repo);
    const branch = options?.branch || project.default_branch || 'main';

    const tree = await this.listRepositoryTree(project.id, branch);

    let mdFiles = tree.filter(
      (node) =>
        node.type === 'blob' &&
        typeof node.path === 'string' &&
        node.path.toLowerCase().endsWith('.md')
    );

    if (options?.pathPattern) {
      const pattern = this.globToRegExp(options.pathPattern);
      mdFiles = mdFiles.filter((node) => pattern.test(node.path));
    }

    const results = await Promise.allSettled(
      mdFiles.map((mdFile) => this.getFileByProject(project, mdFile.path, branch))
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
    const project = await this.getProject(owner, repo);
    const ref = branch || project.default_branch || 'main';
    return this.getFileByProject(project, path, ref);
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
      'User-Agent': 'docAtlas-collector',
    };
  }

  private async getProject(owner: string, repo: string): Promise<GitLabProject> {
    const projectPath = encodeURIComponent(`${owner}/${repo}`);
    const response = await fetch(`${this.baseUrl}/api/v4/projects/${projectPath}`, {
      headers: this.headers(),
    });

    if (!response.ok) {
      throw new Error(`GitLab getRepository failed for ${owner}/${repo} (${response.status})`);
    }

    return (await response.json()) as GitLabProject;
  }

  private async listRepositoryTree(projectId: number, branch: string): Promise<GitLabTreeNode[]> {
    const nodes: GitLabTreeNode[] = [];
    let page = 1;

    while (true) {
      const url = new URL(`${this.baseUrl}/api/v4/projects/${projectId}/repository/tree`);
      url.searchParams.set('ref', branch);
      url.searchParams.set('recursive', 'true');
      url.searchParams.set('per_page', '100');
      url.searchParams.set('page', String(page));

      const response = await fetch(url.toString(), { headers: this.headers() });
      if (!response.ok) {
        throw new Error(`GitLab repository tree request failed (${response.status})`);
      }

      const payload = (await response.json()) as GitLabTreeNode[];
      nodes.push(...payload);

      const nextPage = response.headers.get('x-next-page');
      if (!nextPage) {
        break;
      }

      const parsed = Number(nextPage);
      page = Number.isNaN(parsed) ? page + 1 : parsed;
    }

    return nodes;
  }

  private async getFileByProject(
    project: GitLabProject,
    path: string,
    ref: string
  ): Promise<FileContent> {
    const encodedPath = encodeURIComponent(path);
    const fileUrl = new URL(
      `${this.baseUrl}/api/v4/projects/${project.id}/repository/files/${encodedPath}`
    );
    fileUrl.searchParams.set('ref', ref);

    const fileResponse = await fetch(fileUrl.toString(), { headers: this.headers() });
    if (!fileResponse.ok) {
      throw new Error(
        `GitLab getFile failed for ${project.path_with_namespace}:${path} (${fileResponse.status})`
      );
    }

    const filePayload = (await fileResponse.json()) as GitLabFile;

    const commitsUrl = new URL(`${this.baseUrl}/api/v4/projects/${project.id}/repository/commits`);
    commitsUrl.searchParams.set('ref_name', ref);
    commitsUrl.searchParams.set('path', path);
    commitsUrl.searchParams.set('per_page', '1');

    const commitResponse = await fetch(commitsUrl.toString(), { headers: this.headers() });
    const commits = commitResponse.ok ? ((await commitResponse.json()) as GitLabCommit[]) : [];
    const commit = commits[0];

    const content = Buffer.from(filePayload.content || '', 'base64').toString('utf-8');
    const webFileUrl = this.buildFileUrl(project.web_url, ref, path);
    const updatedAt = commit?.committed_date || new Date().toISOString();

    return {
      path,
      url: webFileUrl,
      content,
      hash: commit?.id || filePayload.last_commit_id || filePayload.blob_id,
      updatedAt,
      createdAt: commit?.authored_date || updatedAt,
      author: commit?.author_name || 'Unknown',
    };
  }

  private buildFileUrl(projectWebUrl: string, ref: string, filePath: string): string {
    const encodedRef = encodeURIComponent(ref);
    const encodedPath = filePath
      .split('/')
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    return `${projectWebUrl}/-/blob/${encodedRef}/${encodedPath}`;
  }

  private mapRepoMetadata(project: GitLabProject): RepositoryMetadata {
    return {
      id: project.path_with_namespace,
      name: project.name,
      description: project.description || undefined,
      url: project.web_url,
      updatedAt: project.last_activity_at || new Date().toISOString(),
      defaultBranch: project.default_branch || 'main',
      isPrivate: project.visibility !== 'public',
    };
  }

  private globToRegExp(pattern: string): RegExp {
    let out = '^';
    for (let i = 0; i < pattern.length; i += 1) {
      const char = pattern[i];

      if (char === '*') {
        const next = pattern[i + 1];
        if (next === '*') {
          out += '.*';
          i += 1;
        } else {
          out += '[^/]*';
        }
        continue;
      }

      if (char === '?') {
        out += '.';
        continue;
      }

      if ('\\^$+?.()|{}[]'.includes(char)) {
        out += `\\${char}`;
      } else {
        out += char;
      }
    }

    out += '$';
    return new RegExp(out);
  }
}
