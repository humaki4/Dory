import {
  Button,
  Dialog,
  Heading,
  Input,
  Modal,
  ModalOverlay,
  SearchField,
} from "react-aria-components";
import { Search, X } from "lucide-react";
import type { SearchResult } from "../model/search.types";
import SearchbarFilters, {
  type SearchbarFiltersProps,
} from "./SearchbarFilters";
import SearchbarResults from "./SearchbarResults";
import styles from "./SearchbarModal.module.css";

interface SearchbarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  results: SearchResult[];
  onResultSelect: (result: SearchResult) => void;
  filters: SearchbarFiltersProps;
}

export default function SearchbarModal({
  open,
  onOpenChange,
  query,
  onQueryChange,
  isLoading,
  isError,
  results,
  onResultSelect,
  filters,
}: SearchbarModalProps) {
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={onOpenChange}
      isDismissable
      className={styles.modalOverlay}
    >
      <Modal className={styles.modal}>
        <Dialog className={styles.dialog}>
          <div className={styles.dialogHeader}>
            <Heading slot="title" className={styles.dialogTitle}>Search</Heading>
            <Button
              className={styles.dialogClose}
              onPress={() => onOpenChange(false)}
            >
              Esc
            </Button>
          </div>

          <SearchField
            aria-label="Search documentation"
            value={query}
            onChange={onQueryChange}
            className={styles.searchField}
          >
            <div className={styles.searchFieldInner}>
              <Search className={styles.searchFieldIcon} aria-hidden="true" />
              <Input
                autoFocus
                className={styles.searchInput}
                placeholder="Search docs, ADRs, meeting notes..."
              />
              <Button
                className={styles.clearButton}
                slot="clear"
                aria-label="Clear search"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          </SearchField>

          <SearchbarFilters {...filters} />

          <div className={styles.resultsMeta} aria-live="polite">
            {results.length} result{results.length === 1 ? "" : "s"}
          </div>

          <SearchbarResults
            isLoading={isLoading}
            isError={isError}
            query={query}
            results={results}
            onResultSelect={onResultSelect}
          />
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
