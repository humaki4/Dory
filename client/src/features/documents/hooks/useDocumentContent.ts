import { useQuery } from "@tanstack/react-query";
import { fetchDocumentContent } from "../api/documents.api";

export const useDocumentContent = (filePath: string) => {
  return useQuery({
    queryKey: ["fileContent", filePath],
    queryFn: () => fetchDocumentContent(filePath),
    enabled: Boolean(filePath),
  });
};
