import { ListBox, ListBoxItem } from "react-aria-components";
import { useMemo } from "react";
import type { SearchResult } from "../model/search.types";
import styles from "./SearchbarResults.module.css";
import SearchbarResultItem from "./SearchbarResultItem";

interface SearchbarResultsProps {
  isLoading: boolean;
  isError: boolean;
  query: string;
  results: SearchResult[];
  onResultSelect: (result: SearchResult) => void;
}

export default function SearchbarResults({
  isLoading,
  isError,
  query,
  results,
  onResultSelect,
}: SearchbarResultsProps) {
  const resultsById = useMemo(() => {
    return new Map(results.map((result) => [result.id, result]));
  }, [results]);

  const handleAction = (key: string | number) => {
    const result = resultsById.get(String(key));
    if (result) {
      onResultSelect(result);
    }
  };

  return (
    <div className={styles.resultsSection}>
      {isLoading && (
        <div className={styles.loadingContainer} role="status">Searching…</div>
      )}

      {!isLoading && isError && (
        <div className={styles.resultsEmpty} role="alert">
          Search is currently unavailable.
        </div>
      )}

      {!isLoading && !isError && query.length < 2 && (
        <div className={styles.resultsHint}>
          Type at least 2 characters to search.
        </div>
      )}

      {!isLoading && !isError && query.length >= 2 && results.length === 0 && (
        <div className={styles.resultsEmpty}>No results found.</div>
      )}

      {!isError && results.length > 0 && (
        <ListBox
          aria-label="Search results"
          className={styles.resultsList}
          selectionMode="single"
          onAction={handleAction}
        >
          {results.map((result) => (
            <ListBoxItem
              key={result.id}
              id={result.id}
              className={styles.resultItem}
              textValue={result.path || result.id}
            >
              <SearchbarResultItem result={result} />
            </ListBoxItem>
          ))}
        </ListBox>
      )}
    </div>
  );
}
