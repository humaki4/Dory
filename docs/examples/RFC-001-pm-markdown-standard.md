---
title: "RFC-001: PM Markdown Standard v1.0"
description: "Open Standard für Projektmanagement-Metadaten in Markdown-Dokumenten"
date: 2026-02-21
status: "draft"
type: "rfc"
tags: [standard, specification, markdown, frontmatter, interoperability]
author: "docAtlas Community"
version: "1.0.0-draft"
---

# RFC-001: PM Markdown Standard v1.0

## Status

**Draft** – Open for community feedback

## Abstract

Dieser RFC definiert einen offenen Standard für Projektmanagement-Metadaten in Markdown-Dokumenten via YAML Frontmatter. Ziel ist es, PM-Workflows direkt in Git-Repositories abzubilden und dabei Tool-Interoperabilität zu gewährleisten.

## Motivation

### Problem

Projektmanagement-Tools (Jira, Linear, GitHub Issues) binden Teams an proprietäre Plattformen:

- Lock-in durch geschlossene Datenformate
- Doku und PM leben in getrennten Silos
- Export/Import ist verlustbehaftet
- Keine Versionierung der PM-Metadaten

### Lösung

**"Issues as Code"** – PM-Artefakte (Features, Stories, Tasks) als versionierte Markdown+Frontmatter direkt im Repository:

- Single Source of Truth (Git)
- Vollständige History (Git Log)
- Code Reviews für PM-Änderungen (Pull Requests)
- Tool-Unabhängigkeit durch offenen Standard

## Specification

### 1. Document Format

PM-Dokumente MÜSSEN valides Markdown mit YAML Frontmatter sein:

```markdown
---
id: "TASK-123"
title: "Implement Feature X"
type: "task"
status: "in-progress"
---

# Implement Feature X

Description goes here...
```

### 2. Core Metadata Fields

#### 2.1 Required Fields

| Field    | Type   | Description                | Example         |
| -------- | ------ | -------------------------- | --------------- |
| `id`     | string | Unique identifier          | `"STORY-142"`   |
| `title`  | string | Human-readable title       | `"Add Search"`  |
| `type`   | string | Document type (see § 2.3)  | `"story"`       |
| `status` | string | Lifecycle status (see § 3) | `"in-progress"` |

#### 2.2 Recommended Fields

| Field            | Type     | Description              | Example              |
| ---------------- | -------- | ------------------------ | -------------------- |
| `description`    | string   | Short summary            | `"Improves UX"`      |
| `priority`       | string   | Priority level (see § 4) | `"high"`             |
| `owner`          | string   | Assignee                 | `"alice"`            |
| `reporter`       | string   | Creator                  | `"bob"`              |
| `team`           | string   | Responsible team         | `"Backend"`          |
| `created`        | date     | Creation timestamp       | `2026-02-21`         |
| `updated`        | date     | Last modification        | `2026-02-21`         |
| `due`            | date     | Due date                 | `2026-03-01`         |
| `tags`           | string[] | Labels/Categories        | `["api", "backend"]` |
| `story_points`   | number   | Estimation (Scrum)       | `5`                  |
| `estimate_hours` | number   | Time estimate            | `8`                  |
| `sprint`         | string   | Sprint/Iteration ID      | `"SPRINT-2026-06"`   |
| `project`        | string   | Project/Product          | `"docAtlas"`         |

#### 2.3 Optional Fields

| Field        | Type     | Description             | Example                  |
| ------------ | -------- | ----------------------- | ------------------------ |
| `linked`     | object   | Relationships (see § 5) | `{ parent: "FEAT-001" }` |
| `blocked_by` | string[] | Blocking dependencies   | `["TASK-120"]`           |
| `blocks`     | string[] | Blocked by this item    | `["TASK-125"]`           |
| `related`    | string[] | Related items           | `["DOC-50"]`             |

### 3. Document Types

Standard PM document types (SHOULD be lowercase):

| Type            | Description            | Parent Types       |
| --------------- | ---------------------- | ------------------ |
| `epic`          | Large initiative       | -                  |
| `feature`       | User-facing capability | `epic`             |
| `story`         | User story             | `epic`, `feature`  |
| `task`          | Technical work item    | `story`, `feature` |
| `subtask`       | Decomposed task        | `task`             |
| `bug`           | Defect                 | -                  |
| `spike`         | Research/Investigation | -                  |
| `backlog`       | Backlog document       | -                  |
| `sprint`        | Sprint/Iteration plan  | -                  |
| `meeting-notes` | Meeting protocol       | -                  |

**Extension:** Tools MAY define custom types using vendor-prefix (e.g., `x_custom_type`).

### 4. Status Lifecycle

Standard status values (MUST be lowercase):

```
planned → ready → in-progress → done
   ↓        ↓          ↓
   └──────→ blocked ──┘
   └──────→ cancelled
```

| Status        | Description                     | Aliases               |
| ------------- | ------------------------------- | --------------------- |
| `planned`     | Identified, not yet prioritized | `backlog`, `todo`     |
| `ready`       | Prioritized, ready to start     | `open`                |
| `in-progress` | Actively being worked on        | `wip`, `active`       |
| `blocked`     | Waiting on external dependency  | -                     |
| `done`        | Completed successfully          | `closed`, `completed` |
| `cancelled`   | Discarded without completion    | `rejected`            |

**Rules:**

- Transitions SHOULD follow the lifecycle (except for `blocked`/`cancelled`)
- `blocked` items SHOULD have `blocked_by` field
- `cancelled` items SHOULD have `cancelled_reason` comment

### 5. Priority Levels

Standard priority values (SHOULD be lowercase):

| Priority   | Description               | Use Case            |
| ---------- | ------------------------- | ------------------- |
| `low`      | Nice to have              | Future enhancements |
| `medium`   | Normal priority           | Standard work       |
| `high`     | Important                 | Near-term delivery  |
| `critical` | Urgent, blocks other work | Production issues   |

### 6. Relationships (`linked` field)

The `linked` field SHOULD be an object containing relationship types:

```yaml
linked:
  parent: "FEAT-001" # Hierarchical parent
  children: ["TASK-339", "TASK-340"]
  blocks: ["TASK-350"] # This item blocks others
  blocked_by: ["TASK-100"] # This item is blocked by others
  related: ["DOC-42"] # Related but not dependent
  epic: "EPIC-10" # Parent epic
  feature: "FEAT-001" # Parent feature
  story: "STORY-142" # Parent story
```

**Cross-References in Content:**

Markdown content MAY reference other items using:

- `#TASK-123` syntax
- `[TASK-123](../tasks/TASK-123.md)` links

### 7. File Naming Convention

**Recommended:** `{TYPE}-{NUMBER}-{slug}.md`

Examples:

- `STORY-142-fuzzy-search-filters.md`
- `TASK-339-implement-search-facets-api.md`
- `FEAT-001-global-search-experience.md`

**Alternative:** `{NUMBER}-{slug}.md` (type derived from frontmatter)

### 8. Directory Structure

**Option A: Flat** (simple)

```
docs/pm/
  FEAT-001-search.md
  STORY-142-filters.md
  TASK-339-api.md
```

**Option B: Typed Folders** (recommended)

```
docs/pm/
  features/
    FEAT-001-search.md
  stories/
    STORY-142-filters.md
  tasks/
    TASK-339-api.md
  sprints/
    SPRINT-2026-06.md
```

**Option C: Hierarchical** (advanced)

```
docs/pm/
  FEAT-001-search/
    FEAT-001.md
    stories/
      STORY-142-filters.md
      tasks/
        TASK-339-api.md
```

### 9. Extension Mechanism

Tools MAY add custom fields using namespaces:

```yaml
# Standard fields
id: "TASK-123"
type: "task"
status: "in-progress"

# Custom extensions (vendor-prefixed)
x_docatlas_doc_sections: ["api", "auth"]
x_jira_epic_key: "PROJ-100"
x_linear_cycle_id: "cycle-uuid"
```

**Namespace Convention:**

- `x_{vendor}_{field}` for tool-specific extensions
- Unknown fields SHOULD be preserved during import/export

### 10. Validation

Valid PM Markdown documents MUST:

1. Contain valid YAML frontmatter
2. Have all required fields (`id`, `title`, `type`, `status`)
3. Use recognized `status` values (or aliases)
4. Have unique `id` within the repository

Tools SHOULD:

- Normalize status aliases to standard values
- Warn on unknown types (but still process)
- Preserve unknown frontmatter fields

### 11. Examples

#### Example 1: Minimal Task

```markdown
---
id: "TASK-100"
title: "Fix login bug"
type: "task"
status: "in-progress"
---

# Fix login bug

User cannot login with special characters in password.
```

#### Example 2: Full Story

```markdown
---
id: "STORY-142"
title: "Fuzzy Search + Tag Filter"
description: "Enable imprecise search queries with tag-based filtering"
type: "story"
status: "ready"
priority: "high"
owner: "alice"
reporter: "product-team"
team: "Search"
created: 2026-02-10
updated: 2026-02-20
sprint: "SPRINT-2026-06"
story_points: 8
tags: [search, ux, filters]
linked:
  feature: "FEAT-001"
  tasks: ["TASK-339", "TASK-340"]
---

# STORY-142: Fuzzy Search + Tag Filter

## User Story

As a user, I want to find documents even with typos in my search query,
and filter results by tags, so I can discover relevant content faster.

## Acceptance Criteria

- [ ] Search tolerates up to 2 character edits
- [ ] Tag filter UI shows available tags
- [ ] Filter combinations work without page reload

## Related

- Feature: #FEAT-001
- Task: #TASK-339
```

#### Example 3: Sprint Plan

```markdown
---
id: "SPRINT-2026-06"
title: "Sprint 2026-06"
type: "sprint"
status: "in-progress"
start_date: 2026-02-17
end_date: 2026-03-02
sprint_goal: "Improve search quality"
capacity_story_points: 24
committed_story_points: 21
team: "Search"
---

# Sprint 2026-06

**Goal:** Deliver noticeable search improvements

## Committed Items

| ID        | Title                | Status      | Points |
| --------- | -------------------- | ----------- | ------ |
| STORY-142 | Fuzzy Search         | in-progress | 8      |
| TASK-339  | Search Facets API    | in-progress | 3      |
| TASK-340  | Frontend Integration | ready       | 5      |

## Risks

- Query latency may increase with fuzzy matching
  - Mitigation: Add caching layer
```

---

## Implementation Guidelines

### For Tool Developers

**Parsing:**

```typescript
import YAML from "yaml";

function parsePMDocument(markdown: string): PMDocument {
  const [, frontmatter, content] = markdown.match(/^---\n(.*?)\n---\n(.*)$/s);
  const metadata = YAML.parse(frontmatter);

  return {
    ...metadata,
    content: content.trim(),
  };
}
```

**Status Normalization:**

```typescript
const STATUS_ALIASES: Record<string, StandardStatus> = {
  backlog: "planned",
  todo: "planned",
  open: "ready",
  wip: "in-progress",
  active: "in-progress",
  closed: "done",
  completed: "done",
  resolved: "done",
};

function normalizeStatus(status: string): StandardStatus {
  return STATUS_ALIASES[status.toLowerCase()] || status;
}
```

**ID Generation:**

```typescript
function generateId(type: string): string {
  const prefix = type.toUpperCase().slice(0, 4);
  const timestamp = Date.now();
  return `${prefix}-${timestamp}`;
}
```

### For End Users

**Creating Documents:**

Use templates for consistency:

```bash
# .docatlas/templates/story.md
---
id: "{{ID}}"
title: "{{TITLE}}"
type: "story"
status: "planned"
priority: "medium"
created: {{DATE}}
---

# {{TITLE}}

## User Story

As a **[role]**, I want **[goal]**, so that **[benefit]**.

## Acceptance Criteria

- [ ]
```

---

## Interoperability

### Import/Export

Tools implementing this standard SHOULD provide:

1. **Import from Jira/Linear:**

   ```bash
   $ tool import jira --project PROJ --output ./docs/pm/
   ```

2. **Export to Jira/Linear:**

   ```bash
   $ tool export ./docs/pm/ --format jira --output export.json
   ```

3. **Bidirectional Sync:**
   ```bash
   $ tool sync jira --bidirectional
   ```

### Compatibility Matrix

| Field          | Jira        | Linear       | GitHub Issues | Notion     |
| -------------- | ----------- | ------------ | ------------- | ---------- |
| `id`           | `key`       | `identifier` | `number`      | `id`       |
| `title`        | `summary`   | `title`      | `title`       | `title`    |
| `status`       | `status`    | `state`      | `state`       | `Status`   |
| `priority`     | `priority`  | `priority`   | -             | `Priority` |
| `story_points` | CustomField | `estimate`   | -             | Points     |
| `owner`        | `assignee`  | `assignee`   | `assignee`    | `Assignee` |

---

## Security Considerations

1. **Sensitive Data:**
   - PM documents may contain confidential information
   - Repositories SHOULD use access controls
   - Consider separate repos for public vs. internal PM data

2. **Cross-Repository References:**
   - External links SHOULD use HTTPS
   - Tools SHOULD validate linked IDs exist

3. **Automation:**
   - Git hooks CAN enforce validation
   - CI pipelines CAN check frontmatter consistency

---

## IANA Considerations

This document requests registration of the MIME type:

```
Type name: text
Subtype name: vnd.pm-markdown
Required parameters: None
Optional parameters: version
```

---

## References

### Normative

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) - Key words for use in RFCs
- [YAML 1.2](https://yaml.org/spec/1.2/) - YAML Specification
- [CommonMark](https://commonmark.org/) - Markdown Specification

### Informative

- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [Front Matter](https://jekyllrb.com/docs/front-matter/) - Jekyll Documentation
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

---

## Changelog

### v1.0.0-draft (2026-02-21)

- Initial draft
- Core metadata fields defined
- Status lifecycle specified
- Relationship model documented

---

## Contributors

- docAtlas Project
- Open for community contributions

---

## License

This specification is released under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

---

## Appendix A: Full Example Repository

See: [github.com/docatlas/pm-markdown-examples](https://github.com/docatlas/pm-markdown-examples)

## Appendix B: Validator Tool

```bash
$ npm install -g pm-markdown-validator
$ pm-markdown-validator ./docs/pm/

✓ 45 documents validated
⚠ 2 warnings:
  - TASK-120: Non-standard status 'reviewing'
  - STORY-99: Missing recommended field 'priority'
```

## Appendix C: Implementation Checklist

- [ ] Parse YAML frontmatter
- [ ] Validate required fields
- [ ] Normalize status values
- [ ] Support relationship links
- [ ] Handle custom extensions (x\_ prefix)
- [ ] Provide import/export for Jira/Linear
- [ ] Implement search/filtering
- [ ] Git integration (commits for changes)

---

**End of RFC-001**
