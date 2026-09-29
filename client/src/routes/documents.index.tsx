import { createFileRoute } from "@tanstack/react-router";
import DocumentBrowserView from "@/features/documents/DocumentBrowserView";

export const Route = createFileRoute("/documents/")({
  component: DocumentsPage,
});

function DocumentsPage() {
  return <DocumentBrowserView />;
}
