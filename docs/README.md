---
title: "docAtlas Documentation Hub"
description: "Central documentation and examples for the docAtlas project"
date: 2026-02-21
tags: [documentation, examples, strategy]
---

# docAtlas Documentation Hub 🐠

## Overview

docAtlas ist ein Tool, das dezentrale Dokumentation aus Git-Repositories (GitHub, GitLab) einsammelt, zentral in einem Web-Interface darstellt und durchsuchbar macht.

## Quick Links

### 📋 Strategy & Analysis

- [**Executive Summary: PM Strategy**](./examples/EXEC-SUMMARY-pm-strategy.md) – Management-Zusammenfassung
- [**ANALYSIS: Markdown PM Strategy**](./examples/ANALYSIS-markdown-pm-strategy.md) – Detailanalyse aus PO/BA/Architect-Perspektiven
- [**DESIGN: Generic Interpretation Layer**](./examples/DESIGN-generic-interpretation-layer.md) – Technisches Design + Code-Beispiele
- [**RFC-001: PM Markdown Standard**](./examples/RFC-001-pm-markdown-standard.md) – Offener Standard für PM-Metadaten

### 📚 Example Documents

#### Technical Documentation

- [ADR-001: Markdown Browser Architecture](./examples/ADR-001-markdown-browser-architecture.md)
- [API Specification: GitHub Integration](./examples/API-specification-github-integration.md)
- [CONCEPT: Document Type System](./examples/CONCEPT-document-type-system.md)
- [DESIGN: Search UI Mockup](./examples/DESIGN-search-ui-mockup.md)
- [HOWTO: Setup Docker Environment](./examples/HOWTO-setup-docker-environment.md)
- [HOWTO: Backend Testing Best Practices](./examples/HOWTO-backend-testing-best-practices.md)
- [RUNBOOK: Incident Search Down](./examples/RUNBOOK-incident-search-down.md)

#### Project Management

- [**Projektmanagement Examples**](./examples/projektmanagement/README.md) – Jira-Style PM mit Markdown
- [Backlog: Product Backlog Q1](./examples/projektmanagement/backlog/BACKLOG-product-backlog.md)
- [Feature: Global Search Experience](./examples/projektmanagement/features/FEAT-001-global-search-experience.md)
- [Story: Fuzzy Search + Filters](./examples/projektmanagement/stories/STORY-142-fuzzy-search-filters.md)
- [Task: Implement Search Facets](./examples/projektmanagement/tasks/TASK-339-implement-search-facets-api.md)
- [Sprint: 2026-06](./examples/projektmanagement/sprints/SPRINT-2026-06.md)
- [Meeting: Sprint Planning](./examples/projektmanagement/meetings/MEETING-2026-02-18-sprint-planning.md)

### 🧰 Features & Tasks

- [Feature 01: Dokumente Typisieren und Taggen](./tasks/feature01_DokumenteTypisierenUndTaggen.md)
- [Feature 02: Entdeckungserlebnis](./tasks/feature02_Entdeckungserlebnis.md)
- [Feature 03: Search](./tasks/feature03_search.md)
- [Feature 04: Doks Anlegen](./tasks/feature04_DoksAnlegen.md)
- [Admin Bereich](./tasks/02_adminBereich.md)

### 🏗️ Architecture

- [Server Architecture](./architecture/server.md)

---

## Key Insights

### Markdown-First PM Approach

docAtlas ermöglicht Projektmanagement direkt in Git-Repositories:

- ✅ **Git als Single Source of Truth** (volle History, Branches, PRs)
- ✅ **Kein Vendor Lock-in** (Standard Markdown + Frontmatter)
- ✅ **Doku + PM integriert** (Code, Tasks, ADRs in einem Repo)
- ✅ **Developer Experience** (keine Tool-Switches)

**Philosophie:** "Dateien erzählen die Wahrheit, Frontend interpretiert nur"

→ UI und Backend sind austauschbar, solange sie RFC-001 (PM Markdown Standard) verstehen
