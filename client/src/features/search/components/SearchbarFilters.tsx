import { Button, Tag, TagGroup, TagList } from "react-aria-components";
import type { Selection } from "../model/searchbarTypes";
import styles from "./SearchbarFilters.module.css";

export interface SearchbarFiltersProps {
  typeOptions: string[];
  tagOptions: string[];
  repoOptions: string[];
  authorOptions: string[];
  selectedTypes: Set<string>;
  selectedTags: Set<string>;
  selectedRepos: Set<string>;
  selectedAuthors: Set<string>;
  onTypeChange: (selection: Selection) => void;
  onTagChange: (selection: Selection) => void;
  onRepoChange: (selection: Selection) => void;
  onAuthorChange: (selection: Selection) => void;
  onClearAll: () => void;
}

function FilterGroup({
  label,
  options,
  selectedKeys,
  onSelectionChange,
}: {
  label: string;
  options: string[];
  selectedKeys: Set<string>;
  onSelectionChange: (selection: Selection) => void;
}) {
  return (
    <div className={styles.filterGroup}>
      <span className={styles.filterLabel}>{label}</span>
      {options.length > 0 ? (
        <TagGroup
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={onSelectionChange}
          aria-label={`${label} filter`}
        >
          <TagList className={styles.filterTags}>
            {options.map((option) => (
              <Tag key={option} id={option} className={styles.filterTag}>
                {option}
              </Tag>
            ))}
          </TagList>
        </TagGroup>
      ) : (
        <span className={styles.filterEmpty}>—</span>
      )}
    </div>
  );
}

export default function SearchbarFilters({
  typeOptions,
  tagOptions,
  repoOptions,
  authorOptions,
  selectedTypes,
  selectedTags,
  selectedRepos,
  selectedAuthors,
  onTypeChange,
  onTagChange,
  onRepoChange,
  onAuthorChange,
  onClearAll,
}: SearchbarFiltersProps) {
  const hasFilters =
    selectedTypes.size > 0 ||
    selectedTags.size > 0 ||
    selectedRepos.size > 0 ||
    selectedAuthors.size > 0;

  return (
    <div className={styles.filtersSection}>
      <div className={styles.filtersHeader}>
        <span className={styles.filtersTitle}>Filters</span>
        {hasFilters && (
          <Button className={styles.filtersClear} onPress={onClearAll}>
            Clear
          </Button>
        )}
      </div>
      <div className={styles.filtersGrid}>
        <FilterGroup
          label="Repo"
          options={repoOptions}
          selectedKeys={selectedRepos}
          onSelectionChange={onRepoChange}
        />
        <FilterGroup
          label="Type"
          options={typeOptions}
          selectedKeys={selectedTypes}
          onSelectionChange={onTypeChange}
        />
        <FilterGroup
          label="Tags"
          options={tagOptions}
          selectedKeys={selectedTags}
          onSelectionChange={onTagChange}
        />
        <FilterGroup
          label="Author"
          options={authorOptions}
          selectedKeys={selectedAuthors}
          onSelectionChange={onAuthorChange}
        />
      </div>
    </div>
  );
}
