import { requestJson } from "@/api/httpClient";
import type { BrowseContent, Repository } from "../model/documents.types";

export function fetchRepositories(): Promise<Repository[]> {
  return requestJson<Repository[]>("/api/documents/");
}

export function fetchDocumentContent(path: string): Promise<BrowseContent> {
  return requestJson<BrowseContent>(`/api/documents/content/${path}`);
}
