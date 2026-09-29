import { useRepositories } from "./hooks/useRepositories";
import useScanRepository from "./hooks/useScanRepository";
import { useState } from "react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { Button } from "@/shared/components/Button";
import { SelectField } from "@/shared/components/Field";
import styles from "./AdministrationView.module.css";

const AdministrationView = () => {
  const { data: session } = useAuthSession();
  const {
    data: repositories,
    isLoading: isLoadingRepositories,
    error: repositoryError,
  } = useRepositories();
  const { scanRepository, isScanning, scanError, scanSuccess } =
    useScanRepository();

  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Administration</h1>
        <p className={styles.description}>Manage repositories, documents, and system settings.</p>
        <p className={styles.account}>Active account: {session?.user?.displayName || session?.user?.username || "unknown"}</p>
      </header>

      <div className={styles.panel}>
        <div className={styles.actions}>
          <SelectField
            label="Repository"
            value={selectedRepo ?? ""}
            onChange={(event) => setSelectedRepo(event.target.value)}
            disabled={isLoadingRepositories || !!repositoryError}
          >
            <option value="" disabled>Select repository</option>
            {repositories?.repositories?.map((repo) => (
              <option key={repo.id} value={repo.id}>{repo.name}</option>
            ))}
          </SelectField>

          <Button
            variant="primary"
            disabled={!selectedRepo || isScanning}
            onClick={() => selectedRepo && scanRepository(selectedRepo)}
          >
            {isScanning ? "Scanning..." : "Scan Repository"}
          </Button>
        </div>

        {isLoadingRepositories ? <p className={styles.status} role="status">Loading repositories…</p> : null}
        {repositoryError ? <p className={`${styles.status} ${styles.error}`} role="alert">{repositoryError.message}</p> : null}
        {scanError ? <p className={`${styles.status} ${styles.error}`} role="alert">{scanError.message}</p> : null}
        {scanSuccess ? <p className={`${styles.status} ${styles.success}`} role="status">Scan started successfully.</p> : null}
      </div>
    </section>
  );
};

export default AdministrationView;
