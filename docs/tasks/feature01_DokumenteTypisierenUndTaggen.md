---
title: "Feature 1: Dokumente Typisieren und Taggen"
description: "Anreicherung von Dokumenten mit Metadaten, Typen und Tags für bessere Findbarkeit und Kategorisierung"
date: 2026-01-31
status: "planning"
type: "feature"
tags: [metadata, tagging, classification, feature]
priority: "high"
version: "1.0"
feature-id: "feature-01"
---

# Feature 1: Dokumente Typisieren und Taggen

## Ziel

Dokumente in Repos sollen mit Typen, Domains, Tags und anderen Metadaten angereichert werden können, sodass sie

- besser gefunden werden können
- Beziehungen erkannt werden
- Übersicht verbessert

### US1: Dokumenttyp angeben

Als Entwickler möchte ich, dass ich beim Erstellen eines dokuments einen Typ (ADR, API Spec, HowTo etc.) angeben kann, damit mein Dokument in der Übersicht und Suche korrekt kategorisiert wird.

### US2: Domain/Kontext zuweisen:

Als Entwickler oder Team möchte ich, dass ich weitere Attribute zuweisen können (feature, domain, microservice, Tags, Author, erstellt am etc.) damit verwandte Dokumente automatisch gruppiert werden können.
Metadaten können den typ string, nummer, datum, array of string, link, boolean, haben

### us3: Filterung & Übersicht

Als Anwender möchte ich, dass ich in der UI nach Typ, Domain etc. filtern kann, damit ich gezielt die relevanten Dokumente finde

### us4: Doc-spezifische Metadaten

Als Entwickler möchte ich, dass je nach dokTyp unterschiedliche Metadatenfelder vorgeschlagen werden, damit ich nur relevante Infos ausfüllen muss

### us5: Metadaten-Templates

Als Teamleiter möchte ich, dass ich für jeden DokType ein Metadaten Template definieren kann, damit neue Dokumente automatisch die richtigen Felder enthalten

### us6: Metadaten aus Git

Als Entwickler möchte ich bestimmte Metainformationen direkt aus dem Git System sehen: Autor, created, modified, updated

## Ideen für DocTypes:

- ADR
- API_spec
- HowTo
- Rundbook
- Architecture
- concept
- onboarding
- meeting_notes
- feature

## ideen für frontmatter attribute (metadaten)

- type
- domain
- status
- tags
- autor
- reviewer
- owner
- team
- related
- project
- space
- due_date
- event_date

## Beispiel Template

type: ADR
status: draft
domain: invoice
tags: [onboarding, pandia, microservice]
author: bla
related: [/feature/abd.md]
project: bookstore
