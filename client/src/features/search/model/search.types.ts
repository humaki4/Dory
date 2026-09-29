export interface SearchResult {
  id: string;
  repo_source_id: string;
  source_id?: string;
  path?: string;
  url: string;
  content: string;
  metadata?: Record<string, unknown>;
}
