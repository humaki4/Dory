---
title: "Feature 2: Entdeckungserlebnis (Discovery & Explorations-UX)"
description: "Verbesserte Navigation, Kuratierung, Related Docs und Qualitätsindikatoren für bessere Auffindbarkeit"
date: 2026-02-08
status: "planning"
type: "feature"
tags: [discovery, ux, navigation, search, recommendations, feature]
priority: "high"
version: "1.0"
feature-id: "feature-02"
---

# Feature 2: Entdeckungserlebnis (Discovery & Explorations-UX)

## Ziel

Nutzer sollen Dokumentation schnell **finden**, **verstehen** und **entdecken** können – ohne exakte Sucheingaben.  
Das System soll zentrale Einstiege, Related Docs, Qualitätsindikatoren und kuratierte Bereiche bereitstellen.

## Umfang (Scope)

- Startseite mit Discovery-Sektionen (Neu, Aktualisiert, Beliebt, Für dich)
- Facettierte Navigation (Filter nach Typ, Tag, Domain, Repo, Owner)
- Related Docs (ähnliche/verbundene Inhalte)
- Qualitätsindikatoren (Freshness, Owner, Status)
- Collections/Kuration (Themen-Sammlungen)
- Quick Preview (Kurzansicht ohne Seitenwechsel)

---

# User Stories

### US1: Discovery-Startseite

Als Nutzer möchte ich eine Startseite mit „Neu“, „Aktualisiert“, „Beliebt“ und „Für dich“ sehen, damit ich ohne gezielte Suche relevante Dokumente entdecke.

**Akzeptanzkriterien**

- Startseite listet 4 Sektionen:
  - Neu (letzte 14 Tage)
  - Aktualisiert (letzte 30 Tage, sortiert nach Änderung)
  - Beliebt (Top-Docs nach Klicks in 30 Tagen)
  - Für dich (Top-Docs aus zuletzt genutzten Repos/Tags)
- Jede Sektion zeigt max. 10 Einträge + „Mehr anzeigen“

---

### US2: Facettierte Navigation

Als Nutzer möchte ich Dokumente nach Typ, Tag, Domain, Repo, Owner und Status filtern, damit ich gezielt die relevantesten Dokumente finde.

**Akzeptanzkriterien**

- Filterleiste in der Liste/Explorer
- Mehrfachauswahl pro Filter möglich
- Bespiel https://polaris-react.shopify.com/components/selection-and-input/filters
- Filter kombinierbar (AND-Logik)
- Filter beeinflussen Listen/Discovery-Sektionen

---

### US3: Related Docs

Als Nutzer möchte ich zu einem Dokument ähnliche oder verbundene Dokumente sehen, um Kontext besser zu verstehen.

**Akzeptanzkriterien**

- Bereich „Related Docs“ auf Dokument-Detailseite
- Regeln:
  1. direkte Links (`related` im Frontmatter)
  2. backlinks (welche Seiten zeigen auf diese Seite)
  3. gleiche Tags (>=2 Tags übereinstimmend)
  4. gleicher Typ + gleiche Domain
- Max. 8 Related Docs
- Keine Duplikate

---

### US4: Qualitätsindikatoren

Als Nutzer möchte ich sehen, ob ein Dokument aktuell, gepflegt und verlässlich ist.

**Akzeptanzkriterien**

- Anzeigen von:
  - Last Updated (Git)
  - Owner/Team (Frontmatter)
  - Status (draft/approved/deprecated)
- Badge „Stale“ bei > 180 Tagen ohne Update
- Badge „Orphaned“ wenn Owner fehlt

---

# Datenmodell / Metadaten

## Zusätzliche Felder

- `owner` / `team`
- `status` (draft, approved, deprecated)
- `updated_at` (Git)
- `created_at` (Git)
- `collection` (optional; manuell gepflegt)

---

# Technische Umsetzung (Schritte)

## 1) Backend/Index

- **Index erweitern** um:
  - Git-Timestamps (created/updated)
  - Owner/Team (Frontmatter)
  - Status (Frontmatter)
  - Popularity (Klicks / Analytics)

- **Search API**
  - Erweiterung um Filterparameter (type, tags, owner, repo, status, domain)
  - Sortierungen: newest, updated, popular

---

## 2) Frontend UI

- Neue Startseite `/discover`
- Sektionen rendern:
  - `GET /discover/sections`
- Related Docs in Dokumentansicht:
  - `GET /documents/:id/related`

---

# API Vorschlag (Beispiele)

**GET /discover/sections**

```json
{
  "new": [...],
  "updated": [...],
  "popular": [...],
  "forYou": [...]
}
```

**GET /documents/:id/related**

```json
{
  "items": [...]
}
```

---

# Akzeptanzkriterien (Systemweit)

- Suche kann filterbar kombiniert werden
- Dokumente zeigen Status/Owner/Last Updated
- Discovery-Startseite vorhanden
- Related Docs werden angezeigt
- Collections können hinzugefügt werden

---
