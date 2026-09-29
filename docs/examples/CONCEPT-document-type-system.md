---
title: "Concept: Document Type System"
description: "Konzeptuelle Beschreibung des flexiblen Dokumenttyp- und Template-Systems"
date: 2026-01-31
status: "active"
type: "concept"
tags: [design, metadata, features, requirements]
author: "Product Team"
version: "2.0"
---

# Concept: Document Type System

## Überblick

Das Document Type System ermöglicht es Teams, verschiedene Arten von Dokumenten zu definieren und zu verwalten, mit automatisch generierten Metadaten-Templates und Validierung.

## Motivation

- Unterschiedliche Dokumente benötigen unterschiedliche Strukturen
- Architektur-Entscheidungen (ADRs) brauchen andere Felder als API-Docs
- Automatische Templates reduzieren Fehlerrate
- Bessere Suche und Filterung durch konsistente Metadaten

## Architektur

### Document Types

```yaml
name: "Architecture Decision Record"
slug: "adr"
description: "Dokumentiert signifikante Architektur-Entscheidungen"
icon: "📋"
color: "#FF6B6B"

fields:
  - name: "decision_date"
    type: "date"
    required: true
  - name: "status"
    type: "enum"
    values: [pending, accepted, deprecated]
    required: true
  - name: "affected_teams"
    type: "array-string"
    required: false
  - name: "implementation_date"
    type: "date"
    required: false
```

### Template Engine

Templates generieren automatisch:

1. Front Matter mit leeren Feldern
2. Markdown Struktur (Sections, Headings)
3. Validierungsregeln

### Workflow

```
Create Doc
    ↓
Select Type
    ↓
Auto-populate Template + Front Matter
    ↓
User fills in fields
    ↓
Validate against Type schema
    ↓
Store in Git + DB
    ↓
Index für Search
```

## Vordefinierte Types

- ADR (Architecture Decision Record)
- API Spec
- HowTo
- Runbook
- Concept
- Meeting Notes
- Incident Report
- Design Document

## Erweiterbarkeit

Teams können eigene Types definieren:

- Über Admin UI (Drag & Drop)
- Via JSON/YAML
- Mit lokalen oder gemeinsamen Templates

## Benefits

✓ Konsistenz über Teams hinweg
✓ Bessere Auffindbarkeit durch Metadaten
✓ Weniger manuelle Fehler
✓ Schneller Onboarding für neue Team-Member
✓ Automatische Validierung

## Implementation Timeline

- Q1 2026: MVP mit vordefinierten Types
- Q2 2026: Custom Type Creator
- Q3 2026: Template Library

## Verwandte Dokumente

- [ADR-001: Architektur](./ADR-001-markdown-browser-architecture.md) - Architektur-Entscheidungen
- [Feature 01: Typisierung & Tagging](../tasks/feature01_DokumenteTypisierenUndTaggen.md) - Feature-Spezifikation
- [Design: Search UI](./DESIGN-search-ui-mockup.md) - UI für Filterung nach Types
- [Meeting Notes: Planning](./MEETING-notes-sprint-planning-2026-05.md) - Umsetzungsplanung
