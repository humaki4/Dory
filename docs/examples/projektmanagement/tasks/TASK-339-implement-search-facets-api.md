---
id: "TASK-339"
title: "Implement Search Facets API"
description: "Erweitert die Search API um Facets für Tags, Type und Status"
date: 2026-02-20
status: "in-progress"
type: "task"
project: "docAtlas"
team: "Backend"
owner: "alex"
reporter: "martina"
priority: "high"
sprint: "SPRINT-2026-06"
estimate_hours: 8
story_points: 3
labels: [api, search, meilisearch]
linked:
  feature: "FEAT-001"
  story: "STORY-142"
---

# TASK-339: Implement Search Facets API

## Ziel

Bereitstellung einer Endpoint-Erweiterung, die Facets für `tags`, `type` und `status` zurückliefert.

## Technischer Scope

- `GET /api/search?q=...` um `facets` Objekt erweitern
- Facet Counts aus Index aggregieren
- Response kompatibel zum bestehenden Frontend halten

## Subtasks

- [x] API Contract aktualisieren
- [x] Search Service um Facet Aggregation erweitern
- [ ] Integration Test für Facet Counts
- [ ] Monitoring für Response-Zeit ergänzen

## Blocker

- Kein Blocker aktiv

## Ergebnisformat (Beispiel)

```json
{
  "query": "auth",
  "results": [],
  "facets": {
    "tags": { "security": 12, "backend": 8 },
    "type": { "runbook": 3, "api-spec": 5 },
    "status": { "active": 9, "draft": 4 }
  }
}
```

## Verwandte Dokumente

- [Story 142](../stories/STORY-142-fuzzy-search-filters.md)
- [Feature 001](../features/FEAT-001-global-search-experience.md)
