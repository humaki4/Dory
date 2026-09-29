---
title: "Architektur-Analyse: Markdown-First PM vs. Custom Solution"
description: "Strategische Bewertung des Markdown+Frontmatter Ansatzes für Projektmanagement"
date: 2026-02-21
status: "draft"
type: "analysis"
tags: [architecture, strategy, product-management, decision]
author: "架構 Team"
version: "1.0"
---

# Architektur-Analyse: Markdown-First PM vs. Custom Solution

## Executive Summary

**Zentrale Frage:** Sind Markdown+Frontmatter-Dokumente eine generische, austauschbare Datenquelle – oder werden sie zu einer Custom-Lösung mit spezifischen Workflows?

**Kurzantwort:** **80% generisch, 20% custom** – mit dem richtigen Design bleibt die Lösung austauschbar und offen, während sie trotzdem PM-spezifische Features ermöglicht.

---

## 🎯 Product Owner Perspektive

### Business Value

#### ✅ Vorteile des Markdown-First Ansatzes

1. **Git als Single Source of Truth**
   - Keine Datensilos zwischen Doku und PM
   - Vollständige History & Audit Trail (Git Commits)
   - Branches = Feature-Branches mit zugehöriger PM-Struktur
   - Pull Requests können Story/Task-Markdown enthalten

2. **Vendor Independence**
   - Kein Lock-in zu Jira/Linear/Monday
   - Teams können Dateien mit beliebigen Tools bearbeiten (VS Code, Obsidian, Notion)
   - Export/Backup = `git clone`

3. **Developer Experience**
   - Devs arbeiten bereits in Git → keine Kontext-Switches
   - Stories/Tasks leben neben Code
   - Lokale Suche mit `grep`/`ripgrep` funktioniert

4. **Reduzierte Kosten**
   - Keine per-seat Lizenzkosten
   - Infrastruktur: nur Git + einfache Suchindexierung

#### ⚠️ Risiken & Limitierungen

1. **Collaboration Overhead**
   - Merge Conflicts bei gleichzeitiger Bearbeitung
   - Keine Echtzeit-Updates wie in Jira
   - Comment-Threads schwieriger als in dedizierten Tools

2. **Fehlende Native PM Features**
   - Keine Drag & Drop Kanban Boards
   - Kein Burndown Chart ohne Parsing
   - Notifications müssen extra gebaut werden

3. **Adoption Barriers**
   - Non-technical PMs müssen Markdown lernen
   - Git-basierte Workflows können abschrecken

### Empfehlung (PO)

**Zielgruppe bestimmt Strategie:**

- **Eng/Product Teams (< 30 Personen):** Markdown-First ist ideal
- **Enterprise/Non-Tech Teams:** Hybrid-Ansatz (Markdown als Backend, komfortable UI)

---

## 💼 Business Analyst Perspektive

### Workflow-Analyse

#### Standard PM Workflows

| Workflow                  | Markdown Native? | Custom UI nötig? | Komplexität |
| ------------------------- | ---------------- | ---------------- | ----------- |
| Story erstellen           | ✅ Template      | Optional         | Low         |
| Status ändern             | ✅ Frontmatter   | Recommended      | Low         |
| Sprint planen             | ⚠️ Manuell       | **Ja**           | Medium      |
| Burndown anzeigen         | ❌ Parsing       | **Ja**           | High        |
| Dependencies visualisiert | ❌ Graph parsing | **Ja**           | High        |
| Cross-Repo aggregieren    | ⚠️ Multi-clone   | **Ja**           | Medium      |

#### Wo wird es "custom"?

1. **Aggregations & Reports**
   - Summe Story Points pro Sprint
   - Velocity Tracking über Zeit
   - Team-Auslastung

   → **Custom UI erforderlich**, aber Daten bleiben generisch (nur Parsing)

2. **Interactive Workflows**
   - Drag & Drop Tasks zwischen Sprints
   - Bulk Status Updates
   - Dependency Graph Navigation

   → **Custom UI erforderlich**, muss aber nur Frontmatter schreiben

3. **Notifications & Automation**
   - "TASK-339 wurde blocked" → Slack
   - "Sprint endet in 2 Tagen" → Email

   → **Custom Service**, aber basierend auf Git Webhooks (generisch)

### Daten-Schema Ausbaufähigkeit

**Generische Felder** (RFC-ähnlich standardisierbar):

```yaml
# Core (jedes PM-Tool versteht diese)
id: string
title: string
status: enum [planned|ready|in-progress|blocked|done|cancelled]
type: enum [feature|story|task|bug|epic]
priority: enum [low|medium|high|critical]
owner: string
created: date
updated: date

# PM-Specific (aber immer noch common)
sprint: string
story_points: number
estimate_hours: number
labels: array<string>

# Relationships (generisch modelliert)
linked:
  parent: string
  children: array<string>
  blocks: array<string>
  blocked_by: array<string>
```

**Custom Extensions** (docAtlas-spezifisch):

```yaml
# Doku-Integration
doc_sections: array<string> # Welche Doku-Abschnitte betroffen?
api_changes: boolean
breaking_change: boolean

# Repository-Kontext
repo: string
affected_services: array<string>
```

### Empfehlung (BA)

**Kern-Schema generisch halten** → ermöglicht Import/Export zu Jira/Linear.
**Custom Extensions** als optionale Felder → docAtlas-spezifische Features.

---

## 🏗️ Technical Architect Perspektive

### Architektur-Entscheidungen

#### Option A: Pure Markdown Interpretation (Empfohlen für MVP)

```
┌─────────────┐
│   Git Repo  │
│  (Markdown) │
└──────┬──────┘
       │ Webhook/Poll
       ▼
┌─────────────────┐
│  Collector      │  ← Parst Frontmatter
│  (Generic)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Search Index   │  ← Meilisearch
│  (Metadata)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  docAtlas UI    │  ← Interpretiert type/status
│  (React)        │
└─────────────────┘
```

**Vorteile:**

- Frontend ist **vollständig austauschbar** (z.B. Obsidian Plugin, CLI, VS Code Extension)
- Keine Datenbank außer Search Index
- Git bleibt "Source of Truth"

**Nachteile:**

- Jede Änderung = Git Commit (kann zu Noise führen)
- Echtzeit-Collaboration schwierig

#### Option B: Hybrid (Cache + Git Sync)

```
┌─────────────┐
│   Git Repo  │
│  (Markdown) │
└──────┬──────┘
       │ Periodic Sync
       ▼
┌─────────────────┐          ┌──────────────┐
│  Sync Service   │─────────▶│  PostgreSQL  │
│  (Bi-directional)│         │  (Cache)     │
└─────────────────┘          └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ docAtlas API │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ docAtlas UI  │
                              └──────────────┘
```

**Vorteile:**

- Schnelle UI-Operationen (DB als Cache)
- Git bleibt Source of Truth (periodischer Sync)
- Kann intermediate States cachen (z.B. während Drag & Drop)

**Nachteile:**

- Komplexere Architektur
- Sync-Konflikte möglich

### API Design (Generisch vs. Custom)

#### Generic REST API (empfohlen)

```typescript
// Generic Document API
GET /api/documents?type=task&status=in-progress
GET /api/documents/TASK-339
PATCH /api/documents/TASK-339
  { "status": "done" }

// Generic Aggregation API
GET /api/documents/aggregate?groupBy=sprint&sum=story_points
```

→ **Vorteil:** Andere Clients (CLI, Obsidian Plugin) können direkt arbeiten

#### Custom PM API (optional als Convenience Layer)

```typescript
// PM-specific convenience endpoints
GET /api/pm/sprints/SPRINT-2026-06/tasks
POST /api/pm/tasks/TASK-339/move-to-sprint
  { "sprint": "SPRINT-2026-07" }
GET /api/pm/burndown?sprint=SPRINT-2026-06
```

→ **Vorteil:** Optimiert für häufige PM-Operationen

### Empfehlung (Architect)

**Phase 1 (MVP):** Option A + Generic API
**Phase 2 (Scale):** Hybrid mit Cache + Custom PM API als Convenience Layer

---

## 🎯 Konkrete Handlungsempfehlungen

### 1. Standards definieren (RFC)

Erstelle ein **"PM Markdown Standard"** Dokument (ähnlich wie ADR):

```yaml
# pm-markdown-standard-v1.0.yaml
version: "1.0.0"
core_fields:
  required: [id, title, type, status]
  optional: [priority, owner, sprint, story_points]

status_lifecycle:
  - planned → ready → in-progress → done
  - any → blocked
  - any → cancelled

type_hierarchy:
  epic:
    children: [feature, story]
  feature:
    children: [story, task]
  story:
    children: [task, subtask]
```

→ **Share als OpenSource** → andere Tools können adoptieren

### 2. Frontend: Layered Interpretation

```typescript
// Generic Layer (austauschbar)
interface Document {
  id: string;
  title: string;
  type: string;
  metadata: Record<string, any>;
  content: string;
}

// PM Layer (docAtlas-spezifisch)
interface PMDocument extends Document {
  type: "feature" | "story" | "task" | "sprint";
  status: PMStatus;
  sprint?: string;
  story_points?: number;
  linked?: {
    parent?: string;
    children?: string[];
  };
}

// Adapter Pattern
class PMDocumentAdapter {
  static fromGeneric(doc: Document): PMDocument {
    // Interpret metadata based on PM Standard
  }
}
```

### 3. Progressive Enhancement

**Level 1: Basic Markdown**

- Einfache Doku-Dateien ohne Frontmatter
- Funktioniert bereits heute

**Level 2: Typed Documents**

- `type: api-spec`, `type: howto`
- Filtering & Icons

**Level 3: PM Workflow**

- `type: task`, `status: in-progress`
- Kanban Boards

**Level 4: Advanced PM**

- Dependencies, Burndown, Velocity
- Custom UI Features

### 4. Escape Hatches

**Für Power Users:**

- CLI Tool: `docatlas task create --template story`
- VS Code Extension: Inline Status Updates
- Git Hooks: Validiere Frontmatter bei Commit

**Für Custom Workflows:**

- Custom Type Definitions per Repository
- Frontmatter Extensions via `x_`-Prefix

---

## 📊 Bewertungsmatrix

| Kriterium                | Markdown-First | Jira/Linear | Hybrid   |
| ------------------------ | -------------- | ----------- | -------- |
| **Austauschbarkeit**     | ⭐⭐⭐⭐⭐     | ⭐          | ⭐⭐⭐   |
| **PM Features**          | ⭐⭐           | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐ |
| **Developer Experience** | ⭐⭐⭐⭐⭐     | ⭐⭐        | ⭐⭐⭐⭐ |
| **Non-Tech Adoption**    | ⭐⭐           | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐ |
| **Kosten**               | ⭐⭐⭐⭐⭐     | ⭐⭐        | ⭐⭐⭐   |
| **Skalierbarkeit**       | ⭐⭐⭐         | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐ |

---

## 🚀 Finale Antwort

### Sind die Dateien für diese Workflows so spezifisch, dass es eh eine Custom Lösung wird?

**Nein**, wenn du:

1. **Kern-Schema standardisiert hältst** (RFC-Style)
2. **Frontend als Interpreter designst**, nicht als Owner
3. **Extensions über Namespaces** (`x_docatlas_*`) ermöglichst
4. **Generic API** anbietest

**Ja**, wenn du:

1. Workflows fest in UI codest (z.B. "Sprint Planning Button macht nur X")
2. Eigene Datenbank als Source of Truth benutzt
3. Keine Import/Export-Schnittstellen baust

### Empfehlung

```yaml
strategy: "Open Core with PM Interpretation Layer"

phases:
  mvp:
    - Generic Document Model
    - Frontmatter-based Filtering
    - Basic Status Lifecycle

  v2:
    - PM-specific UI Components (Kanban, Burndown)
    - API Convenience Layer
    - Obsidian/VS Code Plugins

  v3:
    - PM Markdown Standard RFC
    - Import/Export für Jira/Linear
    - Custom Type Registry

positioning: "Git-native PM für Eng Teams, die Doku + Tasks integrieren wollen"
```

### Marketing Perspective

**Positioning:**

- _"Jira für Markdown-Workflows"_ ❌ (zu limiting)
- _"Documentation Hub mit PM-Superpowers"_ ✅

**Unique Selling Point:**

- "Wo andere Tools Doku und PM trennen, macht docAtlas beides – direkt im Code-Repository."

---

## Verwandte Dokumente

- [CONCEPT: Document Type System](./CONCEPT-document-type-system.md)
- [ADR-001: Markdown Browser Architecture](./ADR-001-markdown-browser-architecture.md)
- [Projektmanagement README](./projektmanagement/README.md)
