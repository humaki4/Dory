---
title: "Design: Search UI Components"
description: "Spezifikation und Mockup für das Search Interface"
date: 2026-01-31
status: "draft"
type: "design"
tags: [ui, search, frontend, design]
designer: "UX Team"
tools: [figma]
figma-link: "https://figma.com/file/xxx"
priority: "high"
---

# Design: Search UI Components

## Komponenten Übersicht

### SearchBar Component

Primäres Eingabeelement für Dokumentsuche

**Features:**

- Real-time Suggestions/Autocomplete
- Recent Searches
- Favorites/Bookmarks
- Scope Selector (All, Spaces, Project, Repo)

**States:**

- Empty
- Focused
- With Suggestions
- With Results
- Loading
- Error

```
┌─────────────────────────────────────────┐
│ 🔍  Search documents...        [Space ▼]│
├─────────────────────────────────────────┤
│ Recent:                                  │
│ • Architecture Decision Records          │
│ • Setup Instructions                     │
├─────────────────────────────────────────┤
│ Suggestions:                             │
│ • Architecture                           │
│ • API Documentation                      │
└─────────────────────────────────────────┘
```

### Search Results Card

Zeigt ein einzelnes Suchergebnis

**Daten:**

- Title
- Type Badge
- Path/Breadcrumb
- Snippet (100 chars)
- Metadata (Tags, Domain, Date)
- Action Menu (Open, Preview, Share)

```
┌────────────────────────────────────────────┐
│ 🏗️  ADR-001: API Architecture              │
│    docs/architecture/decisions/             │
│ Selected our REST API with OpenAPI specs. │
│ Tags: [architecture] [api]                 │
│ Updated: 28. Jan 2026 by Jane Smith        │
│ [Preview] [Open] [...]                     │
└────────────────────────────────────────────┘
```

### Filter Sidebar

Kontextuelle Filter für Suchergebnisse

**Filtergruppen:**

- Type (ADR, API Spec, HowTo, ...)
- Status (Draft, Active, Archived)
- Domain/Tags
- Space/Project
- Last Modified
- Author

```
Filters
├─ Type
│  ☑ ADR (5)
│  ☑ API Spec (3)
│  ☐ HowTo (2)
├─ Status
│  ☑ Active (8)
│  ☐ Draft (2)
└─ Tags
   ☑ backend (6)
   ☐ frontend (4)
```

## Interactions

### Search Flow

1. User tippt in SearchBar
2. Suggestions erscheinen (max 5)
3. User select oder Enter drücken
4. Results anzeigen mit Filters
5. User kann Filters anpassen
6. Results werden aktualisiert
7. Click auf Result öffnet Document

### Mobile Responsiveness

- SearchBar full-width oben
- Filters in Drawer/Modal
- Results in Stack-Layout
- Cards größer für Touch

## Color Scheme

- Primary: #2563EB (Blue)
- Success: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Danger: #EF4444 (Red)
- Text: #1F2937 (Dark)
- Background: #F9FAFB (Light)

## Accessibility

- ARIA Labels auf allen Inputs
- Keyboard Navigation möglich
- Min. 4.5:1 Contrast Ratio
- Focus Indicators sichtbar
- Screen Reader optimiert

## Verwandte Dokumente

- [CONCEPT: Document Type System](./CONCEPT-document-type-system.md) - Type-basierte Filter
- [API: Search Endpoints](./API-specification-github-integration.md) - Backend-Implementierung
- [Feature 03: Suche & Filter](../tasks/feature03_search.md) - Feature-Anforderungen
