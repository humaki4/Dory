# OAuth Setup (GitHub + GitLab)

Dieses Backend unterstützt jetzt OAuth-Login über `/api/auth/:provider/*` mit Session-Cookie und JWT.

## Security-Policy (aktuell)

- Default-Deny für API: alle `/api/*` Routen verlangen Authentifizierung.
- Public-Ausnahmen: nur OAuth Start/Callback (`/api/auth/:provider/start`, `/api/auth/:provider/callback`) sowie optional `/api/health` und `/api/healthz`.
- Content-Zugriff (`documents`, `search`) wird pro Repository gegen die GitHub-Berechtigungen des eingeloggten Nutzers geprüft. Admin-registrierte öffentliche GitHub-Quellen sind für alle angemeldeten Nutzer sichtbar.

## Benötigte ENV-Variablen

- `AUTH_JWT_SECRET` (Pflicht, starkes Secret)
- `AUTH_BACKEND_PUBLIC_URL` (z. B. `http://localhost:3000`)
- `AUTH_CLIENT_SUCCESS_REDIRECT_URL` (z. B. `http://localhost:5173/administration`)
- `AUTH_TOKEN_TTL` (optional, Default `8h`)
- `AUTH_SESSION_COOKIE_NAME` (optional, Default `docatlas_session`)
- `AUTH_GITHUB_TOKEN_CACHE_TTL_MS` (optional, In-Memory-Token-TTL, Default `28800000`)
- `AUTHZ_REPO_CACHE_TTL_MS` (optional, Repo-Access-Cache TTL, Default `120000`)

### GitHub OAuth

- `AUTH_GITHUB_CLIENT_ID` (Pflicht)
- `AUTH_GITHUB_CLIENT_SECRET` (Pflicht)
- `AUTH_GITHUB_REDIRECT_URI` (optional, sonst `${AUTH_BACKEND_PUBLIC_URL}/api/auth/github/callback`)
- `AUTH_GITHUB_SCOPES` (optional, Default `read:user user:email read:org repo`)

### GitLab OAuth

- `AUTH_GITLAB_ENABLED` (optional, Default `false`; bei `true` ist `/api/auth/gitlab/*` aktiv)
- `AUTH_GITLAB_BASE_URL` (optional, Default `https://gitlab.com`; fuer self-hosted z. B. `https://gitlab.example.com`)
- `AUTH_GITLAB_CLIENT_ID` (Pflicht, wenn GitLab aktiviert ist)
- `AUTH_GITLAB_CLIENT_SECRET` (Pflicht, wenn GitLab aktiviert ist)
- `AUTH_GITLAB_REDIRECT_URI` (optional, sonst `${AUTH_BACKEND_PUBLIC_URL}/api/auth/gitlab/callback`)
- `AUTH_GITLAB_SCOPES` (optional, Default `read_user api`)
- `AUTH_GITLAB_ACCESS_COOKIE_NAME` (optional, Default `docatlas_gitlab_access`)
- `AUTH_GITLAB_TOKEN_CACHE_TTL_MS` (optional, Default `28800000`)

### Rollen-Mapping (Admin)

- `AUTH_ADMIN_USERS` (optional, CSV mit GitHub- oder GitLab-Usernames, z. B. `alice,bob`)
- `AUTH_ADMIN_ORGS` (optional, CSV, z. B. `my-org,another-org`)
- `AUTH_ADMIN_TEAMS` (optional, CSV, Format `org/slug`, z. B. `my-org/platform-admins`)

Wenn weder Username, Org noch Team matcht, erhält der User aktuell die Rolle `viewer`.

## Endpunkte

- `GET /api/auth/github/start`
- `GET /api/auth/github/callback`
- `GET /api/auth/gitlab/start`
- `GET /api/auth/gitlab/callback`
- `GET /api/auth/whoami`
- `POST /api/auth/logout`

Hinweis: `whoami` ist durch die globale API-Policy geschützt und liefert ohne gültige Session `401`.

## Wichtiger Scope-Hinweis

GitLab ist fuer OAuth-Login und Session aktivierbar. Repository-Authorisierung im Plugin `repositoryAccess` ist weiterhin GitHub-spezifisch.
