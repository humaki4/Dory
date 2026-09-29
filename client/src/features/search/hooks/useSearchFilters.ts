import { useCallback, useMemo, useState } from "react";
import type { SearchResult } from "../model/search.types";
import type { Selection } from "../model/searchbarTypes";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const collectUnique = <T>(
  items: T[],
  extractor: (item: T) => string | string[] | null | undefined,
  limit: number,
) => {
  const unique = items.reduce((acc, item) => {
    const value = extractor(item);
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (isNonEmptyString(entry)) {
          acc.add(entry);
        }
      });
    } else if (isNonEmptyString(value)) {
      acc.add(value);
    }
    return acc;
  }, new Set<string>());

  return Array.from(unique).slice(0, limit);
};

export default function useSearchFilters(results: SearchResult[]) {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(
    new Set(),
  );

  const options = useMemo(
    () => ({
      types: collectUnique(
        results,
        (result) =>
          isNonEmptyString(result.metadata?.type) ? result.metadata.type : null,
        12,
      ),
      tags: collectUnique(
        results,
        (result) =>
          Array.isArray(result.metadata?.tags) ? result.metadata.tags : null,
        12,
      ),
      repos: collectUnique(results, (result) => result.repo_source_id, 8),
      authors: collectUnique(
        results,
        (result) =>
          isNonEmptyString(result.metadata?.author)
            ? result.metadata.author
            : null,
        8,
      ),
    }),
    [results],
  );

  const normalizeSelection = useCallback(
    (selection: Selection, list: string[]) => {
      if (selection === "all") {
        return new Set(list);
      }
      return new Set(Array.from(selection).map(String));
    },
    [],
  );

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const metadata = result.metadata ?? {};
      const type = isNonEmptyString(metadata.type) ? metadata.type : "";
      const tags = Array.isArray(metadata.tags)
        ? metadata.tags.filter((tag): tag is string => isNonEmptyString(tag))
        : [];
      const author = isNonEmptyString(metadata.author) ? metadata.author : "";
      const repo = result.repo_source_id;

      const matchesType =
        selectedTypes.size === 0 || (type && selectedTypes.has(type));
      const matchesTags =
        selectedTags.size === 0 ||
        tags.some((tag) => selectedTags.has(String(tag)));
      const matchesRepo = selectedRepos.size === 0 || selectedRepos.has(repo);
      const matchesAuthor =
        selectedAuthors.size === 0 || (author && selectedAuthors.has(author));

      return matchesType && matchesTags && matchesRepo && matchesAuthor;
    });
  }, [results, selectedAuthors, selectedRepos, selectedTags, selectedTypes]);

  const handleTypeChange = useCallback(
    (selection: Selection) =>
      setSelectedTypes(normalizeSelection(selection, options.types)),
    [normalizeSelection, options.types],
  );

  const handleTagChange = useCallback(
    (selection: Selection) =>
      setSelectedTags(normalizeSelection(selection, options.tags)),
    [normalizeSelection, options.tags],
  );

  const handleRepoChange = useCallback(
    (selection: Selection) =>
      setSelectedRepos(normalizeSelection(selection, options.repos)),
    [normalizeSelection, options.repos],
  );

  const handleAuthorChange = useCallback(
    (selection: Selection) =>
      setSelectedAuthors(normalizeSelection(selection, options.authors)),
    [normalizeSelection, options.authors],
  );

  const clearFilters = useCallback(() => {
    setSelectedTypes(new Set());
    setSelectedTags(new Set());
    setSelectedRepos(new Set());
    setSelectedAuthors(new Set());
  }, []);

  return {
    options,
    selections: {
      selectedTypes,
      selectedTags,
      selectedRepos,
      selectedAuthors,
    },
    handlers: {
      handleTypeChange,
      handleTagChange,
      handleRepoChange,
      handleAuthorChange,
      clearFilters,
    },
    filteredResults,
  };
}
