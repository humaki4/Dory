import { useId, type ReactNode } from "react";
import styles from "./Section.module.css";

type SectionProps = {
  title: string;
  isEmpty?: boolean;
  emptyLabel?: string;
  children?: ReactNode;
};

const Section = ({
  title,
  isEmpty,
  emptyLabel = "None",
  children,
}: SectionProps) => {
  const headingId = useId();

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.sectionTitle}>{title}</h3>
      {isEmpty ? <p className={styles.emptyState}>{emptyLabel}</p> : children}
    </section>
  );
};

export default Section;
