import MarkdownContent from "../components/MarkdownContent";
import { StateMessage } from "@/shared/components/StateMessage";

type DocumentData = {
  metadata?: Record<string, unknown>;
  content?: string;
};

const DocumentContentView = ({ data }: { data?: DocumentData }) => {
  const content = data?.content ?? "";

  if (!content) {
    return <StateMessage>This document is empty.</StateMessage>;
  }

  return <MarkdownContent content={content} />;
};

export default DocumentContentView;
