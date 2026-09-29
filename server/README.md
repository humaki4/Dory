# docAtlas Server

Das Backend von docAtlas ist eine Fastify-Anwendung fuer Authentifizierung, Repository-Scanning, Dokument-Ingestion, Dokumentauslieferung und Suche auf Basis von MongoDB.

## Verantwortung des Servers

- OAuth-Login fuer GitHub und optional GitLab
- Session-Handling per Cookie
- Ermittlung sichtbarer Repositories anhand der Benutzerrechte
- Laden und Scannen externer Repositories ueber Provider-APIs
- Extraktion und Persistenz von Markdown-Inhalten und Frontmatter
- Dokumentbrowser- und Search-API fuer das Frontend

## Module

- `modules/auth`: OAuth-Flows, Session, Rollen-Mapping, `whoami`, Logout
- `modules/collector`: scanbare Repositories laden, Scans starten, Startup-Sync
- `modules/documents`: ingestierte Dokumente speichern und wieder ausliefern
- `modules/search`: Suche direkt auf MongoDB
- `plugins/auth`: globale API-Authentifizierung und Cookie/JWT-Handling
- `plugins/repositoryAccess`: Repository-basierte Autorisierung
- `plugins/eventBus`: lokale Event-Verteilung zwischen Collector und Documents
- `plugins/mongodb`: MongoDB-Anbindung

## Request-Fluss

1. `index.ts` laedt ENV-Dateien und startet Fastify.
2. `app.ts` registriert Plugins und Module automatisch unter `/api`.
3. Auth-Plugin schuetzt standardmaessig API-Routen.
4. Der Collector liest Inhalte von GitHub oder GitLab.
5. Das Documents-Modul speichert Dokumente in MongoDB.
6. Search und Browser-Endpunkte lesen diese Daten wieder aus.

## Wichtige API-Endpunkte

### Auth

- `GET /api/auth/provider`
- `GET /api/auth/:provider/start`
- `GET /api/auth/:provider/callback`
- `GET /api/auth/whoami`
- `POST /api/auth/logout`

### Administration und Collector

- `GET /api/collector/repositories`
- `POST /api/collector/repositories/:space/:name/scan`

### Dokumente

- `GET /api/documents/`
- `GET /api/documents/content/:space/:name`
- `GET /api/documents/content/:space/:name/*`

### Suche

- `GET /api/search?search=...`
- `GET /api/search/:space?q=...`
- `GET /api/search/:space/:name?q=...`
- `GET /api/search/:space/:name/stats`

## ENV-Dateien und Prioritaet

Beim Start werden diese Dateien in genau dieser Reihenfolge geladen:

1. `server/.env`
2. `server/.env.local`
3. `../.env`
4. `../.env.local`

Spaeter geladene Dateien ueberschreiben fruehere Werte.

## Genutzte ENV-Variablen im Code

### Basis und Laufzeit

- `PORT`: Port des Fastify-Servers, Default `3000`
- `NODE_ENV`: beeinflusst u. a. Cookie-Security und Pretty Logging im Development
- `LOG_LEVEL`: Fastify-Loglevel, Default `trace`
- `MONGODB_URI`: Verbindungsstring fuer MongoDB, Default `mongodb://localhost:27017/docatlas`

### Allgemeine Auth-Konfiguration

- `AUTH_JWT_SECRET`: Secret fuer Session-Token
- `AUTH_BACKEND_PUBLIC_URL`: oeffentliche Backend-URL, z. B. fuer OAuth-Redirects
- `AUTH_CLIENT_SUCCESS_REDIRECT_URL`: Ziel nach erfolgreichem Login
- `AUTH_SESSION_COOKIE_NAME`: Name des Session-Cookies, Default `docatlas_session`
- `AUTH_TOKEN_TTL`: Session-Lebensdauer, Default `8h`

### GitHub OAuth

- `AUTH_GITHUB_CLIENT_ID`
- `AUTH_GITHUB_CLIENT_SECRET`
- `AUTH_GITHUB_REDIRECT_URI`: optional
- `AUTH_GITHUB_SCOPES`: optional, Default `read:user user:email read:org repo`
- `AUTH_GITHUB_ACCESS_COOKIE_NAME`: optional
- `AUTH_GITHUB_TOKEN_CACHE_TTL_MS`: optional

### GitLab OAuth

- `AUTH_GITLAB_ENABLED`: optional, aktiviert GitLab-Login
- `AUTH_GITLAB_BASE_URL`: optional, Default `https://gitlab.com`
- `AUTH_GITLAB_CLIENT_ID`
- `AUTH_GITLAB_CLIENT_SECRET`
- `AUTH_GITLAB_REDIRECT_URI`: optional
- `AUTH_GITLAB_SCOPES`: optional, Default `read_user api`
- `AUTH_GITLAB_ACCESS_COOKIE_NAME`: optional
- `AUTH_GITLAB_TOKEN_CACHE_TTL_MS`: optional

### Rollen und Repository-Sichtbarkeit

- `AUTH_ADMIN_USERS`: CSV mit Admin-Usernames
- `AUTH_ADMIN_ORGS`: CSV mit Admin-Organisationen
- `AUTH_ADMIN_TEAMS`: CSV im Format `org/team-slug`
- `AUTHZ_REPO_CACHE_TTL_MS`: Cache-TTL fuer Repository-Berechtigungen

### Collector und Provider

- `PROVIDER_TYPE`: Default `github`, steuert den aktiven VCS-Provider
- `GITHUB_TOKEN`: Zugriffstoken fuer den GitHub-Collector
- `GITLAB_TOKEN`: Zugriffstoken fuer den GitLab-Collector
- `GITLAB_BASE_URL`: Basis-URL fuer GitLab-Repositories
- `COLLECTOR_STARTUP_SYNC_ENABLED`: bei `false` wird der Startup-Sync deaktiviert

## Docker-Kontext

Die Compose-Dateien im Repository nutzen fuer den Server vor allem diese Werte:

- `MONGODB_URI` wird in `docker-compose.yml` aus `MONGODB_USERNAME`, `MONGODB_PASSWORD` und `MONGODB_DATABASE` zusammengesetzt.
- `GITHUB_TOKEN` und `GITLAB_TOKEN` werden in den Server-Container durchgereicht.
- Im taeglichen Dev-Setup wird haeufig nur MongoDB via `docker-compose.dev.yml` gestartet und der Server lokal mit `npm run dev` ausgefuehrt.

## Lokale Entwicklung

```bash
cd server
npm install
npm run dev
```

Weitere hilfreiche Kommandos:

```bash
npm run typecheck
npm test
npm run lint
```

## Verweise

- [../README.md](../README.md)
- [../client/README.md](../client/README.md)
- [docs/HOWTO-backend-testing-best-practices.md](./docs/HOWTO-backend-testing-best-practices.md)
- [modules/auth/HOWTO-auth-oauth-setup.md](./modules/auth/HOWTO-auth-oauth-setup.md)
