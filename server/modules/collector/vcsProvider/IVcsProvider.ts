export interface RepositoryMetadata {
  id: string;
  name: string;
  description?: string;
  url: string;
  updatedAt: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export interface FileContent {
  path: string;
  url: string;
  content: string;
  hash: string;
  updatedAt: string;
  createdAt: string;
  author: string;
}

export interface ListFilesOptions {
  pathPattern?: string;
  branch?: string;
  maxFiles?: number;
}

export interface IVcsProvider {
  listRepositories(): Promise<RepositoryMetadata[]>;
  getRepository(owner: string, repo: string): Promise<RepositoryMetadata>;
  listMarkdownFiles(
    owner: string,
    repo: string,
    options?: ListFilesOptions
  ): Promise<FileContent[]>;
  getFile(owner: string, repo: string, path: string, branch?: string): Promise<FileContent>;
}
