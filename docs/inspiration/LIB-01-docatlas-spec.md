# @docatlas/spec

## Ziel

`@docatlas/spec` definiert den offenen Standard für PM- und Doku-Artefakte in Markdown.  
Die Spezifikation beschreibt:

- erlaubte Dokumenttypen (ADR, Feature, Story, Task, Meeting, Runbook)
- verpflichtende/optionale Frontmatter-Felder
- Datentypen, Enums, Formate
- Versionsregeln und Rückwärtskompatibilität

Der Kern: **Dateien sind die API**.

---

## Scope (v0.1)

### Dokumenttypen

- `adr`
- `feature`
- `story`
- `task`
- `meeting`
- `runbook`

### Pro Dokumenttyp

- JSON Schema
- Beispiel-Markdown-Template
- Feldbeschreibungen
- Validierungsregeln (MUSS/SOLL/KANN)

---

## Paketstruktur (Vorschlag)

```text
packages/spec/
  schemas/
    common.schema.json
    adr.schema.json
    feature.schema.json
    story.schema.json
    task.schema.json
    meeting.schema.json
    runbook.schema.json
  templates/
    adr.md
    feature.md
    story.md
    task.md
    meeting.md
    runbook.md
  docs/
    spec.md
    versioning.md
    compatibility.md
  src/
    index.ts
    registry.ts
  package.json
```

---

## Konkrete Umsetzungsschritte

1. **Common-Schema definieren**
   - `id`, `title`, `description`, `tags`, `status`, `date`, `type`, `specVersion`
2. **Typspezifische Schemas anlegen**
   - ADR: `decision-date`, `status` etc.
   - Story: `storyPoints`, `dependsOn`, `assignee` etc.
3. **Schema-Registry bauen**
   - Mapping `type -> schema`
4. **Templates bereitstellen**
   - pro Typ ein praktisches Starttemplate
5. **Versionierung festlegen**
   - SemVer + Migrationshinweise
6. **Spec-Dokumentation schreiben**
   - klare Regeln + Beispiele

---

## API-Idee (TypeScript)

- `getSchema(type: ArtifactType): JSONSchema`
- `listTypes(): ArtifactType[]`
- `getTemplate(type: ArtifactType): string`
- `getSpecVersion(): string`

---

## Qualitätskriterien

- Schemas sind maschinenlesbar und dokumentiert
- Jeder Typ hat mind. 2 valide und 2 invalide Beispiele
- Breaking Changes nur mit Major-Version
- Kompatibilitätsmatrix vorhanden

---

## Ergebnis für Nutzer

- Einheitliche Dokumentstruktur
- Austauschbarkeit zwischen Tools
- Klare Basis für Validator, Parser und UI

## weitere inspiration

MADR
ADR
https://github.com/npryce/adr-tools/pulls
https://github.com/adr/madr/
https://adr.github.io/madr/
