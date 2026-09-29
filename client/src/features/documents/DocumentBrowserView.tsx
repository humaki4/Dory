import WorkspaceShell from "./components/WorkspaceShell";
import RepositoryList from "./components/RepositoryList";
import SearchBar from "@/features/search/components/Searchbar";
import PathBreadcrumb from "./components/PathBreadcrumb";
import { useNavigate } from "@tanstack/react-router";
import DocumentOrDirectoryView from "./components/DocumentOrDirectoryView";
import MetadataSidebar from "./components/MetadataSidebar";
import { useDocumentContent } from "./hooks/useDocumentContent";

function DocumentBrowserView({ path }: { path?: string }) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useDocumentContent(path ?? "");
  const metadata = data?.kind === "directory" ? {} : (data?.metadata ?? {});
  const hasMetadata = Object.keys(metadata).length > 0;

  return (
    <WorkspaceShell
      search={
        <SearchBar
          onResultClick={(result) => {
            const sourceId = result.source_id || result.repo_source_id;
            const pathSegment = result.path;

            if (!sourceId || !pathSegment) {
              return;
            }

            navigate({
              to: "/documents/$",
              params: { _splat: `${sourceId}/${pathSegment}` },
            });
          }}
        />
      }
      breadcrumb={<PathBreadcrumb path={path} />}
      navigation={<RepositoryList currentPath={path} />}
      inspector={<MetadataSidebar metadata={metadata} />}
      inspectorAvailable={hasMetadata}
    >
      <DocumentOrDirectoryView
        path={path}
        data={data}
        isLoading={isLoading}
        error={error}
      />
    </WorkspaceShell>
  );
}

export default DocumentBrowserView;
