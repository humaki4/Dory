import { Button } from "react-aria-components";
import { Search } from "lucide-react";
import styles from "./SearchbarTrigger.module.css";

interface SearchbarInputProps {
  onOpen: () => void;
  placeholder?: string;
  shortcutHint?: string;
}

export default function SearchbarInput({
  onOpen,
  placeholder = "Search",
  shortcutHint = "⌘K",
}: SearchbarInputProps) {
  return (
    <Button
      className={styles.searchTrigger}
      onPress={onOpen}
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
    >
      <Search className={styles.searchTriggerIcon} aria-hidden="true" />
      <span className={styles.searchTriggerText}>{placeholder}</span>
      <kbd className={styles.searchTriggerShortcut}>{shortcutHint}</kbd>
    </Button>
  );
}
