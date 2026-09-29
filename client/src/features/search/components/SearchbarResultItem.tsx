import { FileText, Tag } from "lucide-react";
import type { SearchResult } from "../model/search.types";
import styles from "./SearchbarResultItem.module.css";

interface SearchbarResultItemProps {
  result: SearchResult;
}

const truncateText = (text: string, maxLength: number = 120) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

const getResultKind = (type?: string) => {
  if (!type) return "doc";
  const normalized = type.toLowerCase();
  if (normalized.includes("repo") || normalized.includes("repository")) {
    return "repo";
  }
  if (normalized.includes("dir") || normalized.includes("folder")) {
    return "directory";
  }
  if (normalized.includes("file")) {
    return "file";
  }
  return "doc";
};

export default function SearchbarResultItem({
  result,
}: SearchbarResultItemProps) {
  const typeLabel =
    typeof result.metadata?.type === "string" ? result.metadata.type : "Doc";
  const repoLabel =
    typeof result.metadata?.repo === "string"
      ? result.metadata.repo
      : result.repo_source_id;
  const authorLabel =
    typeof result.metadata?.author === "string"
      ? result.metadata.author
      : undefined;
  const pathLabel =
    typeof result.metadata?.path === "string"
      ? result.metadata.path
      : result.id;
  const kind = getResultKind(typeLabel);
  const tags = Array.isArray(result.metadata?.tags)
    ? result.metadata.tags.filter(
        (tag): tag is string => typeof tag === "string",
      )
    : [];

  return (
    <div className={styles.resultCard} data-kind={kind}>
      <div className={styles.resultItemHeader}>
        <FileText className={styles.resultItemIcon} aria-hidden="true" />
        <span className={styles.resultItemTitle}>
          {pathLabel?.replace(/_/g, " - ")}
        </span>
        <span className={styles.resultKind}>{typeLabel}</span>
      </div>
      <p className={styles.resultItemContent}>{truncateText(result.content)}</p>
      <div className={styles.metaRow}>
        <span className={styles.typeBadge}>{typeLabel}</span>
        {repoLabel && <span className={styles.repoBadge}>{repoLabel}</span>}
        {authorLabel && (
          <span className={styles.authorBadge}>{authorLabel}</span>
        )}
        {tags.length > 0 && (
          <div className={styles.tagsRow}>
            {tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className={styles.tagBadge}>
                <Tag size={12} aria-hidden="true" />
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className={styles.moreTags}>+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
