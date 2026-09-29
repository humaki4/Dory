# @docatlas/core

## Ziel

`@docatlas/core` ist die headless Runtime-Library.  
Sie verarbeitet Markdown-Dokumente aus beliebigen Quellen zu einem einheitlichen, verknüpften Datenmodell.

Wichtig: **Repo-Anbindung ist nicht Teil von core** (kommt über `sources/connectors`).

---

## Scope (v0.1)

- Markdown + Frontmatter parsen
- Dokumente normalisieren (IDs, Datumsformate, Statuswerte)
- Referenzen auflösen (Links, IDs, `dependsOn`, `relatesTo`)
- Dokument-Graph erzeugen
- Query/Projection-Basis für UIs und Suche

---

## Paketstruktur (Vorschlag)

```text
packages/core/
  src/
    types.ts
    parse/
      parseDocument.ts
      parseFrontmatter.ts
    normalize/
      normalizeDocument.ts
      normalizeDate.ts
      normalizeStatus.ts
    resolve/
      resolveReferences.ts
      buildBacklinks.ts
    graph/
      buildGraph.ts
    query/
      queryDocuments.ts
    index.ts
  package.json
```

---

## Input/Output-Modell

### Input

`DocumentFile`:
- `path`
- `content`
- `source` (z. B. fs/github/gitlab)
- `lastModified?`

### Output

`CanonicalDocument`:
- `id`
- `type`
- `title`
- `frontmatter` (normalisiert)
- `body`
- `links[]`
- `refs[]`
- `issues[]` (nicht-blockierende Auffälligkeiten)

---

## Konkrete Umsetzungsschritte

1. **Basistypen definieren**
2. **Parser implementieren** (`gray-matter` + Markdown-Parser)
3. **Normalizer bauen**
   - fehlende IDs generieren
   - Datums-/Statusformate vereinheitlichen
4. **Reference Resolver bauen**
   - relative Links auflösen
   - Backlinks und Abhängigkeitskanten erzeugen
5. **Graph Builder**
   - Knoten = Dokumente, Kanten = Beziehungen
6. **Query API**
   - filtern nach Typ, Tag, Status

---

## API-Idee (TypeScript)

- `parseDocument(file: DocumentFile): ParsedDocument`
- `normalizeDocument(doc: ParsedDocument): CanonicalDocument`
- `resolveReferences(docs: CanonicalDocument[]): ResolvedWorkspace`
- `buildGraph(docs: CanonicalDocument[]): DocumentGraph`
- `queryDocuments(docs, query): CanonicalDocument[]`

---

## Nicht-Ziele (v0.1)

- kein GitHub/GitLab-API-Handling
- kein Rendering/Frontend
- keine Persistenzschicht

---

## Ergebnis für Nutzer

- konsistentes Datenmodell für alle weiteren Tools
- stabile Basis für Validator, Suche, UI und Automatisierung