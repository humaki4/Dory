---
id: "STORY-142"
title: "Fuzzy Search + Tag-Filter"
description: "Als Nutzer:in möchte ich auch bei unscharfen Suchbegriffen passende Doks finden und nach Tags filtern"
date: 2026-02-20
status: "ready"
type: "story"
project: "docAtlas"
team: "Search"
owner: "martina"
reporter: "product-owner"
priority: "high"
sprint: "SPRINT-2026-06"
story_points: 8
labels: [search, frontend, backend]
linked:
  feature: "FEAT-001"
  tasks: ["TASK-339"]
---

# STORY-142: Fuzzy Search + Tag-Filter

## User Story

Als Nutzer:in möchte ich bei der Suche auch bei ungenauen Begriffen relevante Dokumente finden und zusätzlich nach Tags eingrenzen können, damit ich schneller zur passenden Doku komme.

## Akzeptanzkriterien (Given / When / Then)

1. **Given** ich suche nach "authentifizirung", **when** ich die Suche starte, **then** erhalte ich Treffer zu "Authentifizierung".
2. **Given** ich habe Treffer, **when** ich die Tags `security` und `backend` auswähle, **then** werden nur passende Dokumente angezeigt.
3. **Given** aktive Filter, **when** ich die Seite neu lade, **then** sind Query und Filter in der URL reproduzierbar.

## Definition of Done

- API liefert Facets (Tags, Type, Status)
- Frontend zeigt aktive Filter-Chips
- Relevanztests mit 20 Referenzqueries bestanden
- Dokumentation im Changelog ergänzt

## Risiken

- Zu aggressive Fuzzy-Parameter verschlechtern Präzision
- Große Tag-Mengen können UI überladen

## Verwandte Dokumente

- [Feature 001](../features/FEAT-001-global-search-experience.md)
- [Task 339](../tasks/TASK-339-implement-search-facets-api.md)
- [Sprint 2026-06](../sprints/SPRINT-2026-06.md)
