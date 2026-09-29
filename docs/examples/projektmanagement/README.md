---
title: "Projektmanagement-Dokumente (Markdown + Frontmatter)"
description: "Beispielstruktur für Jira-ähnliches Arbeiten mit Stories, Tasks, Sprints und Meetings"
date: 2026-02-20
status: "active"
type: "guide"
tags: [projektmanagement, markdown, frontmatter, jira-style]
author: "Product Team"
version: "1.0"
---

# Projektmanagement Beispiele

Dieses Verzeichnis zeigt, wie Projektmanagement-Artefakte als Markdown + Frontmatter modelliert werden können.

## Zielstruktur

```text
projektmanagement/
  README.md
  backlog/
    BACKLOG-product-backlog.md
  features/
    FEAT-001-global-search-experience.md
  stories/
    STORY-142-fuzzy-search-filters.md
  tasks/
    TASK-339-implement-search-facets-api.md
  sprints/
    SPRINT-2026-06.md
  meetings/
    MEETING-2026-02-18-sprint-planning.md
```

## Empfohlenes Frontmatter-Schema

```yaml
id: "TASK-339"
title: "Implement Search Facets API"
type: "task" # backlog | feature | story | task | sprint | meeting-notes
status: "in-progress" # planned | ready | in-progress | blocked | done | cancelled
priority: "high" # low | medium | high | critical
project: "docAtlas"
team: "Search"
owner: "martina"
reporter: "product"
created: 2026-02-10
updated: 2026-02-20
due: 2026-02-23
sprint: "SPRINT-2026-06"
estimate_hours: 8
story_points: 3
labels: [search, backend, api]
linked:
  feature: "FEAT-001"
  story: "STORY-142"
  blocks: ["TASK-341"]
```

## Status-Interpretation (für UI)

- `planned`: erfasst, aber noch nicht priorisiert
- `ready`: priorisiert und umsetzbar
- `in-progress`: aktiv in Bearbeitung
- `blocked`: aktuell blockiert
- `done`: abgeschlossen
- `cancelled`: verworfen

## Hinweise für dein Frontend

- Nutze `type` für Dokument-Icon/Ansichtstyp.
- Nutze `status` für Farben und Spalten (Kanban-ähnlich).
- Nutze `linked` für Beziehungsgraphen (Feature → Story → Task).
- Nutze `sprint`, `story_points`, `estimate_hours` für Planungsauswertungen.

## Verwandte Dokumente

- [Feature 03: Search](../../tasks/feature03_search.md)
- [Meeting Notes: Sprint Planning](../MEETING-notes-sprint-planning-2026-05.md)
- [API Specification: GitHub Integration](../API-specification-github-integration.md)
