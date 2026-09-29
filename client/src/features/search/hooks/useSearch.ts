import { useQuery } from "@tanstack/react-query";
import { searchDocuments } from "../api/search.api";

export function useSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchDocuments(query),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 2,
  });
}
