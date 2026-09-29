---
title: 'HowTo: Backend Testing Best Practices'
description: 'Pragmatic standards for Fastify backend tests in docAtlas'
date: 2026-02-28
status: 'active'
type: 'howto'
tags: [backend, testing, fastify, vitest, quality]
difficulty: 'intermediate'
estimated-time: '20 minutes'
---

# HowTo: Backend Testing Best Practices

## Ziel und Scope

Dieses Dokument definiert den Standard für Backend-Tests im `server` von docAtlas.

Fokus:

- schnelle, deterministische Unit-Tests
- schlanke Route-Tests via Fastify `inject`
- klare Trennung zwischen Unit, Inject und echten Integrations-Tests

Nicht im Scope:

- End-to-End Tests über Frontend + Backend + externe APIs
- Tests mit echten GitHub/GitLab Netzwerkanfragen

## Testpyramide für docAtlas

1. **Service Unit Tests (höchste Priorität)**
   - Prüfen Business-Logik in Modulen wie `collector/service.ts`.
   - Mocken nur Systemgrenzen (`vcsProvider`, `eventBus`, Logger).

2. **Route Inject Tests (zweite Priorität)**
   - Prüfen HTTP-Verhalten (`statusCode`, Response-Shape, Error-Mapping).
   - Nutzen Fastify `inject`, ohne echten Netzwerk-Port.

3. **Integration Smoke Tests (sparsam)**
   - Nur für kritische Flows mit realen Plugins/Infra.
   - Nicht Teil des regulären Unit-Test-Sets.

## Standardstruktur pro Modul

Für ein Modul `server/modules/<module>`:

- `service.test.ts` → Unit-Tests für Service-Logik
- `routes.test.ts` → Inject-Tests für HTTP-Routen
- Optional: `fixtures/` für wiederverwendbare Testdaten

Für `collector`:

- Service: `server/modules/collector/service.test.ts`
- Routes: `server/modules/collector/routes.test.ts`

## Best Practices beim Testdesign

- **Deterministisch halten:** Keine echten Zeitabhängigkeiten ohne Clock-Mock.
- **Boundary-Mocking:** Nur externe Abhängigkeiten mocken, nicht die zu testende Logik selbst.
- **1 Verhalten pro Test:** Ein klarer Grund für Fail/Pass.
- **Aussagekräftige Namen:** Testtitel als Business-Outcome formulieren.
- **Fehlerpfade explizit testen:** Jede wichtige Exception muss eine eigene Assertion haben.

## Assertions-Standard

Mindestens prüfen:

- **Input Forwarding:** Aufrufe an Abhängigkeiten enthalten die erwarteten Argumente.
- **Output Contract:** Rückgabeobjekt/HTTP-Response entspricht Contract.
- **Side Effects:** Events oder andere Effects wurden erwartungsgemäß ausgelöst.
- **Error Mapping:** Fehlerpfade liefern konsistente Exceptions/Statuscodes.

## Kommandos

Im Ordner `server`:

```bash
npm run test
npm run test:watch
```

## CI-Erwartungen

- Tests sind lokal reproduzierbar ohne zusätzliche Secrets.
- Kein Test darf von externen Diensten abhängen.
- Neue Backend-Features gelten erst als "done", wenn Happy Path + Edge Cases + Error Path getestet sind.

## Häufige Fehlerbilder und Gegenmaßnahmen

- **Flaky durch Zeitstempel:** `vi.useFakeTimers()` + feste Systemzeit setzen.
- **Brittle Payload-Checks:** Nur stabile, fachlich relevante Felder strikt vergleichen.
- **Übermocking:** Keine internen Methoden mocken, nur externe Boundaries.
- **Kontrakt-Drift:** API-Dokumentation regelmäßig gegen Route-Implementierung prüfen.

## Definition of Done für Backend-Tests

Ein Backend-Task ist testseitig abgeschlossen, wenn:

- Service-Logik mit Unit-Tests abgedeckt ist.
- Routen mit Inject-Tests inkl. Fehlerpfaden abgedeckt sind.
- Lokale Testkommandos erfolgreich laufen.
- Dokumentation bei neuen Mustern/Regeln aktualisiert wurde.

## Related Docs

- [API Specification: GitHub Integration](./API-specification-github-integration.md)
- [RUNBOOK: Incident Search Down](./RUNBOOK-incident-search-down.md)
- [Daily Copilot Skills Playbook](../skills/DAILY-COPILOT-SKILLS.md)
