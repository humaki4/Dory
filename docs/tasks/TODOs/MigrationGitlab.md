## Plan: GitLab Connector Mit Vorherigem Refactoring

Empfehlung: Beide Provider im Code unterstützen, aber pro Deployment nur einen aktivieren (`VCS_PROVIDER_TYPE=github|gitlab`).

### Warum so?

- Passt zum realen Betrieb (meist entweder GitHub oder GitLab)
- Weniger Komplexität in Auth/Session/Token-Handling
- Erweiterbar für späteren Dual-Provider-Betrieb

### Schritte

1. Scope fixieren: in Phase 1 genau ein aktiver Provider pro Deployment.
2. Akzeptanzkriterien definieren: Auth, Repo-Liste, Scan, Mongo-Persistenz für beide Provider.
3. OAuth-Adapter-Vertrag prüfen und verpflichtend machen (`buildAuthorizationUrl`, `exchangeCodeForToken`, `loadIdentity`).
4. Auth-Refactoring auf Provider-Neutralität:
   - generischer Token-Cache (`provider + userId`)
   - dynamische Access-Cookies je Provider
   - provider-neutrale Fehlerbehandlung im Callback
5. GitLab OAuth vollständig implementieren:
   - Code-Exchange
   - Identity laden
   - Gruppen/Teams normalisieren
6. Repository-Access-Schicht entkoppeln:
   - GitHub-Hardcodings reduzieren
   - provider-neutrale Schnittstellen nutzen
7. GitLab VCS-Provider implementieren:
   - `listRepositories`
   - `listMarkdownFiles`
   - `getFile`
8. ENV/Startup robust machen:
   - `VCS_PROVIDER_TYPE` validieren
   - nur für aktiven Provider Pflicht-ENV prüfen
9. End-to-End testen:
   - GitHub Regression
   - GitLab vollständiger Flow
10. Doku aktualisieren (`README`, `.env.example`, Betriebsmodus).

### Aktuelle Hürden (vor Refactoring)

- GitHub-spezifischer Token-Cache und Cookies
- unvollständiger GitLab OAuth-Callback
- GitHub-zentrierte Repo-Access-Pfade
- Rollenmapping stark auf GitHub-Teammodell ausgelegt

### Betroffene Kern-Dateien

- `server/modules/auth/oauth-flow-service.ts`
- `server/modules/auth/providers/provider.ts`
- `server/modules/auth/providers/github-provider.ts`
- `server/modules/auth/providers/gitlab-provider.ts`
- `server/modules/auth/session.ts`
- `server/modules/auth/config.ts`
- `server/modules/auth/mapping.ts`
- `server/plugins/auth/auth.ts`
- `server/plugins/auth/github-token-cache.ts`
- `server/plugins/repositoryAccess/service.ts`
- `server/plugins/repositoryAccess/github.ts`
- `server/modules/collector/vcsProvider/IVcsProvider.ts`
- `server/modules/collector/vcsProvider/implementations/github.ts`
- `server/modules/collector/vcsProvider/index.ts`
- `server/modules/collector/service.ts`
- `server/modules/documents/ingestService.ts`

### Verifikation

1. Unit-Tests für OAuth-Flow (`github`, `gitlab`, Fehlerfälle).
2. Unit-Tests für Cookie/Token-Cache pro Provider.
3. Integrationstest mit `VCS_PROVIDER_TYPE=github`.
4. Integrationstest mit `VCS_PROVIDER_TYPE=gitlab`.
5. Manueller Smoke-Test: Login -> Repo-Liste -> Scan -> Mongo.
