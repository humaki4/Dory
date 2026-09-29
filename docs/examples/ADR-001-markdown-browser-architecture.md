---
title: "ADR-001: Markdown Browser Architecture"
description: "Architecture Decision Record für die Architektur des docAtlas Markdown Browsers"
date: 2026-01-31
status: "accepted"
type: "adr"
tags: [architecture, decision, frontend, backend]
author: "Architecture Team"
decision-date: 2026-01-31
implemented: false
---

# ADR-001: Markdown Browser Architecture

## Status

Accepted

## Context

Wir benötigen eine Lösung zum Browsing und Anzeigen von Markdown-Dateien aus verschiedenen Git-Repositories. Die Lösung soll skalierbar und benutzerfreundlich sein.

## Decision

Wir werden eine Client-Server Architektur implementieren mit:

- **Frontend**: React/TypeScript mit Vite
- **Backend**: Fastify Server mit Meilisearch für Indexierung
- **Metadaten**: Front Matter YAML für strukturierte Dokumentation

## Rationale

- **React**: Moderne UI, große Community, gute Dokumentation
- **Fastify**: High-performance Node.js Framework
- **Meilisearch**: Schnelle, einfache Suchengine mit gutem DevX
- **Front Matter**: Standard in statischen Site-Generatoren, weit verbreitet

## Consequences

- Notwendigkeit für Node.js Umgebung
- Zusätzliche Komplexität bei der Verwaltung von Git-Repositories
- Gutes Seperationof Concerns zwischen Frontend und Backend

## Verwandte Dokumente

- [CONCEPT: Document Type System](./CONCEPT-document-type-system.md) - Grundlage für das Metadaten-System
- [Meeting Notes: Sprint Planning](./MEETING-notes-sprint-planning-2026-05.md) - Umsetzungsplanung basierend auf diesem ADR
- [Feature 01: Dokumente Typisieren](../tasks/feature01_DokumenteTypisierenUndTaggen.md) - Implementierung der Metadaten
