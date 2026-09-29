import { useQuery } from "@tanstack/react-query";
import { fetchRepositories } from "../api/documents.api";

export function useRepositories() {
  return useQuery({
    queryKey: ["repositories", "visible"],
    queryFn: fetchRepositories,
  });
}
