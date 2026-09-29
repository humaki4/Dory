import DocumentBrowserView from "@/features/documents/DocumentBrowserView";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/documents/$")({
  component: DocumentsPathPage,
});

function DocumentsPathPage() {
  const { _splat } = Route.useParams();

  return <DocumentBrowserView path={_splat} />;
}
