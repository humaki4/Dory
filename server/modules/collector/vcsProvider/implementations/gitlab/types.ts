export type GitLabProject = {
  id: number;
  name: string;
  path_with_namespace: string;
  description: string | null;
  web_url: string;
  last_activity_at: string | null;
  default_branch: string | null;
  visibility: 'private' | 'internal' | 'public';
};

export type GitLabTreeNode = {
  id: string;
  name: string;
  type: 'tree' | 'blob';
  path: string;
  mode: string;
};

export type GitLabFile = {
  file_path: string;
  content: string;
  encoding: 'base64' | string;
  blob_id: string;
  last_commit_id?: string;
};

export type GitLabCommit = {
  id: string;
  authored_date?: string;
  committed_date?: string;
  author_name?: string;
};
