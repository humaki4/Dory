import Section from "./Section";
import styles from "./IndexPreview.module.css";

type IndexPreviewProps = {
  content: string;
};

const IndexPreview = ({ content }: IndexPreviewProps) => (
  <Section title="index.md">
    <pre className={styles.indexContent}>{content}</pre>
  </Section>
);

export default IndexPreview;
