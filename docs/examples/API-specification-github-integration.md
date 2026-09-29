---
title: "GitHub Integration API"
description: "API Spezifikation für die GitHub Repository Integration"
date: 2026-01-31
status: "draft"
type: "api-spec"
tags: [api, github, integration, backend]
version: "1.0.0"
author: "Backend Team"
---

# GitHub Integration API

## Overview

Diese API ermöglicht die Integration von GitHub Repositories in docAtlas.

## Endpoints

### POST /api/collector/scan-repo

Startet das Scannen eines GitHub Repositories.

**Request:**

```json
{
  "repoUrl": "https://github.com/owner/repo",
  "branch": "main",
  "spaceId": "space-123"
}
```

**Response (200):**

```json
{
  "scanId": "scan-abc-123",
  "status": "in-progress",
  "filesFound": 42,
  "startedAt": "2026-01-31T10:30:00Z"
}
```

### GET /api/collector/scan-repo/{scanId}

Ruft den Status eines Scans ab.

**Response (200):**

```json
{
  "scanId": "scan-abc-123",
  "status": "completed",
  "filesProcessed": 42,
  "documentsIndexed": 40,
  "completedAt": "2026-01-31T10:35:00Z"
}
```

### GET /api/documents

Ruft alle Dokumente ab.

**Query Parameters:**

- `spaceId` (optional): Filter nach Space
- `type` (optional): Filter nach Dokumenttyp
- `tags` (optional): Filter nach Tags
- `search` (optional): Volltextsuche

**Response (200):**

```json
{
  "documents": [
    {
      "id": "doc-123",
      "title": "Architecture Guide",
      "type": "guide",
      "path": "docs/architecture.md",
      "spaceId": "space-123",
      "tags": ["architecture", "backend"],
      "updatedAt": "2026-01-30T15:20:00Z"
    }
  ],
  "total": 1,
  "page": 1
}
```

## Error Handling

Alle Fehler folgen diesem Format:

```json
{
  "error": {
    "code": "INVALID_REPO_URL",
    "message": "The provided repository URL is invalid",
    "status": 400
  }
}
```

## Verwandte Dokumente

- [ADR-001: Markdown Browser Architecture](./ADR-001-markdown-browser-architecture.md) - Architektur-Grundlagen
- [HOWTO: Docker Setup](./HOWTO-setup-docker-environment.md) - Lokale Entwicklungsumgebung
- [Feature 04: Doks Anlegen](../tasks/feature04_DoksAnlegen.md) - Feature-Details
