import styles from "./TagList.module.css";

type TagListProps = {
  items: string[];
  variant?: "default" | "type";
};

const TagList = ({ items, variant = "default" }: TagListProps) => (
  <ul className={styles.tagList}>
    {[...items].sort((left, right) => left.localeCompare(right)).map((item) => (
      <li
        key={item}
        className={`${styles.tag}${variant === "type" ? ` ${styles.typeTag}` : ""}`}
      >
        {item}
      </li>
    ))}
  </ul>
);

export default TagList;
