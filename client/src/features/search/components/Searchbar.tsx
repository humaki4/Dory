import { useCallback, useState } from "react";
import { useSearch } from "../hooks/useSearch";
import type { SearchResult } from "../model/search.types";
import { useDebouncedState } from "@/shared/hooks/useDebounce";
import styles from "./SearchbarLayout.module.css";
import SearchbarInput from "./SearchbarInput";
import SearchbarModal from "./SearchbarModal";
import useSearchFilters from "../hooks/useSearchFilters";
import useSearchShortcut from "../hooks/useSearchShortcut";

interface SearchBarProps {
  onResultClick?: (result: SearchResult) => void;
}

export default function SearchBar({ onResultClick }: SearchBarProps) {
  const [open, setOpen] = useState(false);

  const [query, debouncedQuery, setQuery] = useDebouncedState("", 300);

  const { data: results = [], isLoading, isError } = useSearch(debouncedQuery, open);

  const openModal = useCallback(() => setOpen(true), []);
  useSearchShortcut(openModal);

  const handleResultSelect = (result: SearchResult) => {
    onResultClick?.(result);
    setOpen(false);
    setQuery("");
  };
  const { options, selections, handlers, filteredResults } =
    useSearchFilters(results);

  return (
    <div className={styles.searchbarRoot}>
      <SearchbarInput onOpen={openModal} />

      <SearchbarModal
        open={open}
        onOpenChange={setOpen}
        query={query}
        onQueryChange={setQuery}
        isLoading={isLoading}
        isError={isError}
        results={filteredResults}
        onResultSelect={handleResultSelect}
        filters={{
          typeOptions: options.types,
          tagOptions: options.tags,
          repoOptions: options.repos,
          authorOptions: options.authors,
          selectedTypes: selections.selectedTypes,
          selectedTags: selections.selectedTags,
          selectedRepos: selections.selectedRepos,
          selectedAuthors: selections.selectedAuthors,
          onTypeChange: handlers.handleTypeChange,
          onTagChange: handlers.handleTagChange,
          onRepoChange: handlers.handleRepoChange,
          onAuthorChange: handlers.handleAuthorChange,
          onClearAll: handlers.clearFilters,
        }}
      />
    </div>
  );
}
