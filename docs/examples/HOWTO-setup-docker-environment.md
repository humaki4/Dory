---
title: "HowTo: Docker Umgebung Setup"
description: "Schritt-für-Schritt Anleitung zum Aufsetzen der Docker Entwicklungsumgebung"
date: 2026-01-31
status: "active"
type: "howto"
tags: [docker, setup, development, tutorial]
difficulty: "beginner"
estimated-time: "15 minutes"
---

# HowTo: Docker Umgebung Setup

## Voraussetzungen

- Docker installiert (Version 20.10+)
- Docker Compose installiert (Version 2.0+)
- Git installiert
- Mindestens 4GB freier RAM

## Schritt 1: Repository klonen

```bash
git clone https://github.com/yourorg/docAtlas.git
cd docAtlas
```

## Schritt 2: Environment-Datei erstellen

```bash
cp .env.example .env
```

Bearbeite `.env` und setze deine GitHub Token:

```env
GITHUB_TOKEN=your_token_here
MEILISEARCH_MASTER_KEY=dev_key_123
```

## Schritt 3: Docker Compose starten

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Dies startet:

- **Frontend** auf `http://localhost:5173`
- **Backend** auf `http://localhost:3000`
- **Meilisearch** auf `http://localhost:7700`

## Schritt 4: Logs prüfen

```bash
docker-compose -f docker-compose.dev.yml logs -f
```

## Schritt 5: Erste Repo scannen

1. Öffne `http://localhost:5173`
2. Gehe zu Admin > Neuen Space erstellen
3. Füge ein GitHub Repository hinzu
4. Starte den Scan

## Troubleshooting

**Port bereits in Benutzung:**

```bash
# Nutze alternative Ports
docker-compose -f docker-compose.dev.yml -e "PORT=3001" up -d
```

**Docker Memory Fehler:**

```bash
# Erhöhe Docker Memory in Docker Desktop Settings
# oder nutze:
docker-compose down
docker system prune
```

## Nächste Schritte

- [API Dokumentation](./API-specification-github-integration.md)
- [Runbook: Troubleshooting](./RUNBOOK-incident-search-down.md)
- [Feature: Dokumente Anlegen](../tasks/feature04_DoksAnlegen.md)
