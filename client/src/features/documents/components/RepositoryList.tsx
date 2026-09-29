import { Database } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { StateMessage } from "@/shared/components/StateMessage";
import { useRepositories } from "../hooks/useRepositories";
import styles from "./RepositoryList.module.css";

interface RepositoryListProps {
  currentPath?: string;
}

export default function RepositoryList({ currentPath }: RepositoryListProps) {
  const { data: repositories = [], isLoading, error } = useRepositories();

  if (isLoading) {
    return <StateMessage tone="loading">Loading repositories…</StateMessage>;
  }

  if (error) {
    return (
      <StateMessage tone="error">Repositories could not be loaded.</StateMessage>
    );
  }

  if (repositories.length === 0) {
    return <StateMessage>No repositories available.</StateMessage>;
  }

  return (
    <nav className={styles.container} aria-label="Repositories">
      <ul className={styles.list}>
        {repositories.map((repository) => {
          const isSelected =
            currentPath === repository.sourceId ||
            currentPath?.startsWith(`${repository.sourceId}/`);

          return (
            <li key={repository.sourceId}>
              <Link
                to="/documents/$"
                params={{ _splat: repository.sourceId }}
                className={styles.repositoryLink}
                data-selected={isSelected || undefined}
                aria-current={isSelected ? "page" : undefined}
              >
                <Database className={styles.repositoryIcon} aria-hidden="true" />
                <span className={styles.repositoryName}>{repository.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
