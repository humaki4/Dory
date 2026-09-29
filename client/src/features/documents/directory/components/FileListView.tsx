import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import styles from "./FileListView.module.css";

type FileItem = {
  path: string;
  name?: string;
  metadata?: { tags?: string[]; type?: string };
};

interface FileListViewProps {
  files: FileItem[];
  documentPathFor: (path: string) => string;
}

const FileListView = ({ files, documentPathFor }: FileListViewProps) => {
  const sortedFiles = [...files].sort((left, right) =>
    (left.name || left.path).localeCompare(right.name || right.path),
  );

  return (
    <div className={styles.fileList}>
      <div className={styles.fileListHeader} aria-hidden="true">
        <div className={styles.colTitle}>Name</div>
        <div className={styles.colType}>Type</div>
        <div className={styles.colTags}>Tags</div>
      </div>
      <ul className={styles.fileListItems} aria-label="Files">
        {sortedFiles.map((file) => (
          <li key={file.path}>
            <Link
              to="/documents/$"
              params={{ _splat: documentPathFor(file.path) }}
              className={styles.fileListItem}
            >
              <span className={styles.colTitle}>
                <FileText className={styles.fileIcon} aria-hidden="true" />
                <span className={styles.fileName}>{file.name || file.path}</span>
              </span>
              <span className={styles.colType}>
                {file.metadata?.type ? (
                  <span className={styles.typeTag}>{file.metadata.type}</span>
                ) : (
                  <span className={styles.emptyCell}>–</span>
                )}
              </span>
              <span className={styles.colTags}>
                {file.metadata?.tags && file.metadata.tags.length > 0 ? (
                  <span className={styles.tagsList}>
                    {file.metadata.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                    {file.metadata.tags.length > 3 && (
                      <span className={styles.moreTag}>
                        +{file.metadata.tags.length - 3}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className={styles.emptyCell}>–</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileListView;
