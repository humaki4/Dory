export interface Repository {
  id?: string;
  sourceId: string;
  name: string;
  fullName?: string;
  [key: string]: unknown;
}

export interface DocumentContent {
  kind?: "file";
  content: string;
  path: string;
  metadata?: Record<string, unknown>;
}

export interface DirectoryContent {
  kind: "directory";
  path?: string;
  files?: Array<{
    path: string;
    name?: string;
    metadata?: { tags?: string[]; type?: string };
    url?: string;
    updatedAt?: string;
  }>;
  directories?: Array<{ path: string; name?: string }>;
  index?: {
    path: string;
    content?: string;
    metadata?: Record<string, unknown>;
    url?: string;
  } | null;
  tags?: string[];
  types?: string[];
}

export type BrowseContent = DocumentContent | DirectoryContent;
