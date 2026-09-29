---
title: "Executive Summary: PM Markdown Strategy"
description: "Entscheidungsgrundlage für Markdown-First vs. Custom PM-Lösung"
date: 2026-02-21
status: "active"
type: "executive-summary"
tags: [strategy, decision, product, architecture]
author: "Product & Engineering Leadership"
audience: [founders, investors, technical-leads]
---

# Executive Summary: PM Markdown Strategy

## TL;DR (30 Sekunden)

**Kernfrage:** Sind Markdown+Frontmatter-Dokumente eine generische Wahrheit, oder bauen wir eine Custom-Lösung?

**Antwort:** **80% generisch, 20% custom** ist möglich und empfohlen.

**Strategie:** "Open Core" – generisches Daten-Schema + austauschbare UI-Interpreter.

**Differenzierung:** "Jira für Dev-Teams, die Doku und PM integrieren wollen – ohne Vendor Lock-in."

---

## Problem Statement

Projektmanagement-Tools (Jira, Linear) und Dokumentation (Confluence, Notion) zwingen Teams in getrennte Silos:

- **Doku** lebt in einem Tool
- **PM-Artefakte** (Stories, Tasks) in einem anderen
- **Code** in Git
- **Keine einheitliche Versionierung**

→ Kontext-Switches, Duplikation, Lock-in

---

## Lösungsansatz: "Issues as Code"

PM-Artefakte werden als **Markdown + Frontmatter** direkt im Repository gespeichert:

```markdown
---
id: "TASK-339"
title: "Implement Search Facets"
type: "task"
status: "in-progress"
sprint: "SPRINT-2026-06"
owner: "alex"
story_points: 3
---

# Implement Search Facets API

Description...
```

**Vorteile:**

- ✅ **Git als Single Source of Truth** (volle History, Branches, PRs)
- ✅ **Keine Vendor Lock-in** (Standard Markdown)
- ✅ **Doku + PM leben zusammen** (Code, Tasks, ADRs in einem Repo)
- ✅ **Developer Experience** (keine Tool-Switches)

---

## Architektur-Prinzip

### "Dateien erzählen die Wahrheit, Frontend interpretiert nur"

```
┌─────────────────────────────────────────┐
│        Git Repository (Markdown)        │  ← Single Source of Truth
│  - Features, Stories, Tasks, Meetings   │
└────────────────┬────────────────────────┘
                 │
      ┌──────────┼──────────┐
      │          │          │
      ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ docAtlas │ │ Obsidian │ │   CLI    │  ← Austauschbare Clients
│    UI    │ │  Plugin  │ │   Tool   │
└──────────┘ └──────────┘ └──────────┘
```

**Was ist generisch?**

- Core Frontmatter Schema (RFC-001)
- REST API (standard CRUD + Filter)
- Status Lifecycle (planned → ready → in-progress → done)
- Beziehungsgraphen (linked: { parent, children, blocks })

**Was ist docAtlas-spezifisch?**

- UI-Komponenten (Kanban Board, Burndown Chart)
- PM-Convenience API (optional, nutzt Generic API)
- Doku-Integration (Code-Referenzen, API-Änderungen verlinken)

---

## Drei Perspektiven

### 🎯 Product Owner

**Business Case:**

- **Zielgruppe:** Engineering Teams (5–50 Personen)
- **Positionierung:** "PM für Dev-Teams mit Doku-Kontext, ohne Vendor Lock-in"
- **Pricing:** Freemium (Self-Hosted) + SaaS (Multi-Repo Cloud)

**Risiken:**

- Non-Technical PMs könnten Markdown/Git als Einstiegshürde sehen
  - **Mitigation:** Komfortable UI + Templates
- Jira/Linear haben mehr PM-Features
  - **Mitigation:** Fokus auf Integration (Doku + PM), nicht Feature-Parität

**Empfehlung:** MVPHybrid (Markdown Backend, UI-guided Editing)

---

### 💼 Business Analyst

**Workflow-Kompatibilität:**

| Jira Workflow    | Markdown Native? | Custom UI nötig? |
| ---------------- | ---------------- | ---------------- |
| Story erstellen  | ✅ Template      | Optional         |
| Status ändern    | ✅ Frontmatter   | Empfohlen        |
| Sprint planen    | ⚠️ Manuell       | **Ja**           |
| Burndown Chart   | ❌ Berechnet     | **Ja**           |
| Dependency Graph | ❌ Aus Links     | **Ja**           |

**Daten-Interoperabilität:**

- **Import:** Jira/Linear → Markdown (vollständig möglich)
- **Export:** Markdown → Jira/Linear (90% Coverage)
- **Bidirektional Sync:** Machbar mit Conflict Resolution

**Empfehlung:** Kern-Schema nach RFC-001, Custom Extensions via `x_docatlas_*`

---

### 🏗️ Technical Architect

**Architektur-Optionen:**

| Option                | Complexity | Latency | Git = Truth | Empfohlen |
| --------------------- | ---------- | ------- | ----------- | --------- |
| **Pure Markdown**     | Low        | High    | ✅          | MVP       |
| **Hybrid (DB Cache)** | Medium     | Low     | ✅ (Sync)   | Scale     |
| **DB as Source**      | High       | Low     | ❌          | ❌        |

**Phase 1 (MVP):**

```typescript
// Generic Document Model
interface Document {
  id: string;
  type: string;
  metadata: Record<string, any>;
  content: string;
}

// PM Interpreter (austauschbar)
class PMInterpreter {
  interpret(doc: Document): PMDocument {
    return {
      ...doc,
      status: normalizeStatus(doc.metadata.status),
      sprint: doc.metadata.sprint,
    };
  }
}
```

**Phase 2 (Scale):**

- PostgreSQL als Cache (schnelle Queries)
- Bidirektionaler Sync zu Git
- Webhook-basierte Updates

**API-Design:**

```typescript
// Generic (austauschbar)
GET /api/documents?type=task&status=in-progress

// PM-Specific (Convenience)
GET /api/pm/sprints/SPRINT-2026-06/burndown
```

**Empfehlung:** Start mit Generic API + Interpreter Pattern

---

## Technische Standards

### RFC-001: PM Markdown Standard

Definiert offenes Schema:

```yaml
# Required
id: string # "TASK-339"
title: string # "Implement Facets"
type: string # "task" | "story" | "feature" | ...
status: string # "planned" | "ready" | "in-progress" | ...

# Recommended
priority: string # "low" | "medium" | "high" | "critical"
owner: string
sprint: string
story_points: number
linked: # Relationships
  parent: string
  blocks: string[]
```

**Status Lifecycle:**

```
planned → ready → in-progress → done
   ↓        ↓          ↓
   └──────→ blocked ──┘
   └──────→ cancelled
```

**Austauschbarkeit:**

- Andere Tools können den Standard implementieren
- Import/Export zu Jira/Linear möglich
- Diverse Clients (CLI, Obsidian, VS Code) nutzbar

---

## Differenzierung vs. Konkurrenz

| Feature                 | Jira       | Linear     | GitHub Projects | **docAtlas** |
| ----------------------- | ---------- | ---------- | --------------- | ------------ |
| **PM Workflows**        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐          | ⭐⭐⭐       |
| **Doku-Integration**    | ⭐⭐       | ⭐         | ⭐⭐            | ⭐⭐⭐⭐⭐   |
| **Git-Native**          | ❌         | ❌         | ⚠️ Issues only  | ✅ Full      |
| **Vendor Independence** | ❌         | ❌         | ⚠️ GitHub       | ✅ Open Std  |
| **Dev Experience**      | ⭐⭐       | ⭐⭐⭐     | ⭐⭐⭐⭐        | ⭐⭐⭐⭐⭐   |

**Unique Value:**

- ✅ **Doku + PM in einem System** (nicht 2 Tools)
- ✅ **Git-Versionierung für PM-Metadaten**
- ✅ **Kein Lock-in** (Markdown ist portabel)
- ✅ **Dev-Friendly** (CLI, VS Code, Git Workflows)

---

## Risiken & Mitigationen

### Risiko 1: "Zu generisch → Niemand nutzt es"

**Mitigation:**

- Opinionated Default-Templates
- Guided Onboarding (Auto-Setup für GitHub Repos)
- Best-Practice Beispiele (wie aktuell in `/docs/examples/projektmanagement/`)

### Risiko 2: "Zu custom → Lock-in trotzdem"

**Mitigation:**

- RFC-001 als Open Standard veröffentlichen
- Export-Funktionen zu Jira/Linear
- Interpreter Pattern (andere UIs können entwickeln)

### Risiko 3: "Git-Merge-Konflikte bei PM-Dateien"

**Mitigation:**

- DB-Cache für UI-Operationen (Drag & Drop → Buffer → Git Commit)
- Conflict Resolution UI
- Atomare Frontmatter-Updates (nur ein Feld)

### Risiko 4: "Non-Tech PMs lehnen Markdown ab"

**Mitigation:**

- WYSIWYG-Editor mit Frontmatter-Formular
- Status-Updates über UI (Git-Commits unsichtbar)
- Templates für alle Dokument-Typen

---

## Go-to-Market Strategy

### Phase 1: Open Source MVP (Q2 2026)

- Core Features:
  - Markdown-Parsing + Frontmatter-Indexing
  - Basis-Suche + Filter
  - Simple Status-Updates
- Ziel: 500 GitHub Stars, 10 aktive Repos

### Phase 2: PM Features (Q3 2026)

- Kanban Board, Sprint Planning
- Burndown Charts, Velocity Tracking
- Obsidian + VS Code Extensions
- Ziel: 50 zahlende Teams (Self-Hosted Pro)

### Phase 3: Cloud SaaS (Q4 2026)

- Multi-Repo Support
- Team-Collaboration Features
- Jira/Linear Sync
- Ziel: 500 zahlende User

---

## Kosten vs. Jira

| Szenario | Jira (per Jahr) | docAtlas (Self-Hosted) | Ersparnis |
| -------- | --------------- | ---------------------- | --------- |
| 10 Devs  | $8,400          | $0 (Open Source)       | 100%      |
| 25 Devs  | $21,000         | $1,200 (Pro)           | 94%       |
| 50 Devs  | $42,000         | $2,400 (Pro)           | 94%       |

_(Jira Standard: $70/user/year, docAtlas Pro: $10/user/month)_

---

## Empfehlung

### ✅ Baue eine **Open-Core Lösung mit generischem Kern**

**Kern-Prinzipien:**

1. **RFC-001 als Standard** veröffentlichen (Community-driven)
2. **Interpreter Pattern** für UI (austauschbar)
3. **Git bleibt Source of Truth** (DB nur als Cache)
4. **Import/Export** für Jira/Linear (Tag 1 Priorität)

**Positionierung:**

> "docAtlas: Projektmanagement für Dev-Teams, die ihre Doku nicht von ihren Tasks trennen wollen."

**Timeline:**

- **März 2026:** RFC-001 Draft veröffentlichen (Community Feedback)
- **April 2026:** MVP mit Generic API + Basic UI
- **Mai 2026:** Obsidian + VS Code Extensions
- **Juni 2026:** Jira Import/Export

---

## Anhänge

- [ANALYSIS: Markdown PM Strategy](./ANALYSIS-markdown-pm-strategy.md) – Detailanalyse
- [DESIGN: Generic Interpretation Layer](./DESIGN-generic-interpretation-layer.md) – Code-Beispiele
- [RFC-001: PM Markdown Standard](./RFC-001-pm-markdown-standard.md) – Spezifikation
- [Projektmanagement Examples](./projektmanagement/README.md) – Beispiel-Dokumente

---

**Letzte Aktualisierung:** 21. Februar 2026  
**Nächster Review:** Q2 2026 Planning
