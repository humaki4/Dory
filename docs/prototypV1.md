---
title: "Prototype V1 - Feature Set MVP"
description: "Minimum Viable Product Feature Set für docAtlas Prototype V1"
date: 2026-01-31
status: "planning"
type: "specification"
tags: [mvp, prototype, requirements]
version: "1.0"
priority: "high"
---

# Feature Set MVP

## laden der Docs:

- /scan repo
- hole repos Infos aus git
- speicher in db
- hole alle md dateien
- speicher in db
- speicher in index
-

## laden der Docs II

- angabe space
- auflisten der repos (dropdown)
- scan repo

## administration

- erstellen von spaces
- erstellen einer struktur
  - spaces, projects, repos?
  - drag'n'drop der struktur?
- erstellen von tags/doc_types
- doc_type templates
- doc_types zuweisen und ausfüllen
- infos werden (zunächst) in DB gespeichert und beim Abruf angereichert

## browse Docs:

- liste der Repos
- liste der Files (schalter flat/folder)
- klick auf Datei zeigt doc (aus db, nicht direkt aus git)

## suche

- Suchfeld
- Liste mit Card, die Zusammenfassung der Docs zeigt
- Klcik auf Eintrag = Anzeige der Datei

## demo

- öffentliches Projekt als Beispiel
- https://github.com/desktop
- https://github.com/TanStack/query
- reines Doku-Projekt erstelle (Wiki-Beispiel)
- komplexere Markdown Files erstellen
  - renderer aufhübschen

## DB Collections

### repositories

- space
- name
- git_url
- zusammenfassung
-

### docs

- name
- path
- content
- parent
- doc_types
