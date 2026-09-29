---
title: "PM Schema Examples"
description: "JSON Schema Beispiele fuer PM-Typen (Task, Story, Feature, Sprint)"
date: 2026-02-21
status: "draft"
type: "guide"
tags: [schema, json-schema, pm, examples]
author: "docAtlas"
version: "1.0"
---

# PM Schema Examples

Diese JSON-Schemas definieren PM-Objekttypen fuer einen Jira-Clone auf Basis von Markdown + Frontmatter.

## Dateien

- `task.schema.json`
- `story.schema.json`
- `feature.schema.json`
- `sprint.schema.json`

## Hinweise

- Die Schemas enthalten UI-Hints (`x-*` Felder) fuer Form-Generatoren.
- Core-Felder (`id`, `title`, `type`, `status`) sind in jedem Schema vorhanden.
- Custom-Felder koennen spaeter per `x_custom_*` erweitert werden.
