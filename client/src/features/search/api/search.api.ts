import { requestJson } from "@/api/httpClient";
import type { SearchResult } from "../model/search.types";

export function searchDocuments(query: string): Promise<SearchResult[]> {
  if (query.length < 2) {
    return Promise.resolve([]);
  }

  return requestJson<SearchResult[]>(
    `/api/search?search=${encodeURIComponent(query)}`,
  );
}
