---
title: "Runbook: Suchindex ausfallgefallen"
description: "Incident Response Anleitung wenn der Meilisearch Service nicht erreichbar ist"
date: 2026-01-31
status: "active"
type: "runbook"
tags: [incident, ops, troubleshooting, search]
severity: "high"
affected-service: "search"
author: "DevOps Team"
---

# Runbook: Suchindex ausfallgefallen

## Symptome

- Suchfeld zeigt Error "Search service unavailable"
- Fehler: `connection refused` auf Port 7700
- User können Dokumente nicht suchen

## Schnelle Diagnostik (< 5 Min)

### 1. Meilisearch Status prüfen

```bash
docker-compose -f docker-compose.dev.yml ps

# Suche nach meilisearch Container Status
# Status sollte "Up" sein
```

### 2. Health Check

```bash
curl http://localhost:7700/health

# Response sollte sein:
# {"status":"available"}
```

### 3. Container Logs prüfen

```bash
docker-compose -f docker-compose.dev.yml logs meilisearch | tail -50
```

## Recovery Steps

### Szenario A: Container ist stopped

```bash
# Starte Meilisearch neu
docker-compose -f docker-compose.dev.yml up -d meilisearch

# Warte 10 Sekunden und prüfe Health
sleep 10
curl http://localhost:7700/health
```

### Szenario B: Container läuft aber nicht responsive

```bash
# Restart forcen
docker-compose -f docker-compose.dev.yml restart meilisearch

# Monitoring für 30 Sekunden
for i in {1..6}; do
  curl http://localhost:7700/health && echo "✓ OK" || echo "✗ DOWN"
  sleep 5
done
```

### Szenario C: Index ist korrupt

```bash
# Backup erstellen
docker-compose -f docker-compose.dev.yml exec meilisearch \
  tar czf /meilisearch-backup-$(date +%s).tar.gz /meili_data

# Index neu aufbauen
curl -X DELETE http://localhost:7700/indexes/documents

# Re-indexing triggern (Backend)
curl -X POST http://localhost:3000/api/admin/reindex-all
```

## Verifikation

✓ Health Check erfolgreich
✓ Suchfeld ist reaktiv
✓ Suche gibt Ergebnisse zurück
✓ Keine Fehler im Browser Console

## Wenn nichts hilft

1. Eskaliere zu Backend Team (Slack: #backend-support)
2. Status auf Statuspage.io aktualisieren
3. Notify Stakeholder

## Weitere Ressourcen

- [Meilisearch Dokumentation](https://docs.meilisearch.com)
- [CONCEPT: Document Type System](./CONCEPT-document-type-system.md)
- [HOWTO: Docker Setup](./HOWTO-setup-docker-environment.md)
- [API Spezifikation](./API-specification-github-integration.md)
