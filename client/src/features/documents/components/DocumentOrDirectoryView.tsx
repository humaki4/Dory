import DirectoryView from "../directory/DirectoryView";
import DocumentContentView from "../document/DocumentView";
import type { BrowseContent } from "../model/documents.types";
import { StateMessage } from "@/shared/components/StateMessage";

interface DocumentOrDirectoryViewProps {
  path?: string;
  data?: BrowseContent;
  isLoading: boolean;
  error?: Error | null;
}

const DocumentOrDirectoryView = ({
  path,
  data,
  isLoading,
  error,
}: DocumentOrDirectoryViewProps) => {
  if (!path) {
    return (
      <StateMessage>
        Select a document from search to start browsing.
      </StateMessage>
    );
  }

  if (isLoading) {
    return <StateMessage tone="loading">Loading document…</StateMessage>;
  }

  if (error) {
    return (
      <StateMessage tone="error">
        The requested content could not be loaded.
      </StateMessage>
    );
  }

  if (data?.kind === "directory") {
    return <DirectoryView data={data} />;
  }

  if (data) {
    return <DocumentContentView data={data} />;
  }

  return <StateMessage>No content found for this path.</StateMessage>;
};

export default DocumentOrDirectoryView;
