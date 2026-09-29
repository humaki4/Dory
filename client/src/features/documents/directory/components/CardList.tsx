import type { ReactNode } from "react";
import styles from "./CardList.module.css";

type CardListProps = {
  children: ReactNode;
};

const CardList = ({ children }: CardListProps) => (
  <ul className={styles.cardList}>{children}</ul>
);

export default CardList;
