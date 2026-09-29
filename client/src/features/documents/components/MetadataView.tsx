import styles from "./MetadataView.module.css";
import { Badge } from "@/shared/components/Badge";

interface Metadata {
  [key: string]: unknown;
}

interface MetadataViewProps {
  metadata: Metadata;
}

const priority: Record<string, number> = {
  type: 1,
  tags: 2,
  status: 3,
  date: 4,
  created: 5,
  updated: 6,
  title: 7,
  description: 8,
  author: 9,
  version: 10,
};

function MetadataValue({ name, value }: { name: string; value: unknown }) {
  if (name === "type") {
    return <Badge tone="accent">{String(value).toUpperCase()}</Badge>;
  }

  if (name === "tags" && Array.isArray(value)) {
    const tags = value.filter((tag): tag is string => typeof tag === "string");
    return (
      <span className={styles["metadata-tags"]}>
        {tags.map((tag, index) => <Badge key={`${tag}-${index}`}>{tag}</Badge>)}
      </span>
    );
  }

  if (["title", "description", "author", "version"].includes(name)) {
    return <span className={styles["metadata-secondary"]}>{String(value)}</span>;
  }

  let displayValue: string;
  if (Array.isArray(value)) {
    displayValue = value.join(", ");
  } else if (value !== null && typeof value === "object") {
    displayValue = JSON.stringify(value);
  } else {
    displayValue = String(value);
  }

  return <span className={styles["metadata-default"]}>{displayValue}</span>;
}

export default function MetadataView({ metadata }: MetadataViewProps) {
  const sortedEntries = Object.entries(metadata).sort(([keyA], [keyB]) => {
    const priorityA = priority[keyA.toLowerCase()] ?? 100;
    const priorityB = priority[keyB.toLowerCase()] ?? 100;
    return priorityA - priorityB;
  });

  if (sortedEntries.length === 0) {
    return null;
  }

  return (
    <dl className={styles["metadata-content"]}>
      {sortedEntries.map(([key, value]) => (
        <div key={key} className={styles["metadata-item"]}>
          <dt className={styles["metadata-label"]}>{key}</dt>
          <dd className={styles["metadata-value"]}>
            <MetadataValue name={key} value={value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
