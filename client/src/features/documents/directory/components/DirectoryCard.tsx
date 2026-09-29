import { Link } from "@tanstack/react-router";
import { Folder } from "lucide-react";
import styles from "./DirectoryCard.module.css";

type DirectoryItem = {
  path: string;
  name?: string;
};

type DirectoryCardProps = {
  directory: DirectoryItem;
  documentPath: string;
};

const DirectoryCard = ({ directory, documentPath }: DirectoryCardProps) => (
  <li className={styles.card}>
    <Link
      to="/documents/$"
      params={{ _splat: documentPath }}
      className={styles.cardLink}
    >
      <Folder className={styles.cardIcon} aria-hidden="true" />
      <span className={styles.cardTitle}>{directory.name || directory.path}</span>
    </Link>
  </li>
);

export default DirectoryCard;
