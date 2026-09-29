import { useParams } from "@tanstack/react-router";
import styles from "./DirectoryView.module.css";
import type { DirectoryContent } from "../model/documents.types";
import CardList from "./components/CardList";
import DirectoryCard from "./components/DirectoryCard";
import FileListView from "./components/FileListView";
import IndexPreview from "./components/IndexPreview";
import Section from "./components/Section";
import TagList from "./components/TagList";

const DirectoryView = ({ data }: { data: DirectoryContent }) => {
  const { _splat } = useParams({ from: "/documents/$" });

  const getBaseRepo = () => {
    if (!_splat) return "";
    if (!data.path) return _splat;
    const suffix = `/${data.path}`;
    return _splat.endsWith(suffix) ? _splat.slice(0, -suffix.length) : _splat;
  };

  const baseRepo = getBaseRepo();

  const joinSplat = (repo: string, path: string) =>
    repo ? `${repo}/${path}` : path;

  const documentPathFor = (path: string) => joinSplat(baseRepo, path);

  const title =
    data.path?.split("/").filter(Boolean).pop() ||
    baseRepo.split("/").filter(Boolean).pop() ||
    "Directory";
  const directories = [...(data.directories ?? [])].sort((left, right) =>
    (left.name || left.path).localeCompare(right.name || right.path),
  );

  return (
    <section className={styles.directoryContainer} aria-labelledby="directory-title">
      <div className={styles.directoryContent}>
        <h1 id="directory-title" className={styles.directoryTitle}>{title}</h1>

        {data.index?.content ? (
          <IndexPreview content={data.index.content} />
        ) : null}

        <Section title="Files" isEmpty={!data.files?.length}>
          {data.files && (
            <FileListView
              files={data.files}
              documentPathFor={documentPathFor}
            />
          )}
        </Section>

        <Section title="Subdirectories" isEmpty={directories.length === 0}>
          <CardList>
            {directories.map((dir) => (
              <DirectoryCard
                key={dir.path}
                directory={dir}
                documentPath={documentPathFor(dir.path)}
              />
            ))}
          </CardList>
        </Section>

        <Section title="Types" isEmpty={!data.types?.length}>
          {data.types ? (
            <TagList
              items={data.types}
              variant="type"
            />
          ) : null}
        </Section>

        <Section title="Tags" isEmpty={!data.tags?.length}>
          {data.tags ? (
            <TagList items={data.tags} />
          ) : null}
        </Section>
      </div>
    </section>
  );
};

export default DirectoryView;
