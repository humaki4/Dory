import MetadataView from "./MetadataView";
import styles from "./MetadataSidebar.module.css";

interface MetadataSidebarProps {
  metadata: Record<string, unknown>;
}

const MetadataSidebar = ({ metadata }: MetadataSidebarProps) => {
  if (Object.keys(metadata).length === 0) {
    return null;
  }

  return (
    <div className={styles.metadataSidebar}>
      <MetadataView metadata={metadata} />
    </div>
  );
};

export default MetadataSidebar;
