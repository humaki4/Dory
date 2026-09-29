# docAtlas Client

Das Frontend von docAtlas ist eine React-Anwendung auf Basis von Vite, TanStack Router und TanStack Query. Es bildet den Einstieg fuer Login, Administration, Dokumentbrowser und Suche.

## Aufgaben des Clients

- Login-Start ueber den konfigurierten OAuth-Provider
- Session-Check ueber `/api/auth/whoami`
- Administrationsansicht zum Auswaehlen und Scannen von Repositories
- Dokumentbrowser fuer ingestierte Inhalte
- Globale Suche ueber die Backend-API

## Routen

- `/`: Landingpage mit Login
- `/documents`: geschuetzter Dokumentbereich
- `/documents/$`: Pfadbasierte Dokumentansicht
- `/administration`: geschuetzter Admin-Bereich

## API-Anbindung

Der Client verwendet im Anwendungscode relative API-Pfade unter `/api`. Alle
HTTP-Aufrufe laufen ueber `src/api/httpClient.ts`; Feature-Komponenten rufen
keine Backend-Endpunkte direkt auf.

- Im Dev-Modus leitet Vite `/api` an `http://localhost:3000` weiter.
- Im Container-Setup uebernimmt Nginx das Proxying von `/api` an den Server-Container.

Der Client liest derzeit keine `import.meta.env`-Variablen aus dem Code. Die Konfiguration erfolgt also aktuell ueber den Infrastrukturkontext und nicht ueber eigene Frontend-ENV-Keys.

## Wichtige Datenfluesse

### Auth

- `fetchAuthSession()` liest den aktuellen Login-Status.
- `fetchAuthProvider()` laedt den aktiven Provider.
- `startProviderLogin()` leitet zu `/api/auth/:provider/start` weiter.
- Logout erfolgt ueber `POST /api/auth/logout`.

### Dokumente

- `useRepositories()` laedt sichtbare Repositories ueber `GET /api/documents/`.
- `useDocumentContent()` laedt Inhalte ueber `GET /api/documents/content/:space/:name/*`.

### Suche

- `useSearch()` ruft `GET /api/search?search=...` auf.
- Die Suche startet erst ab mindestens zwei Zeichen.

## Struktur

- `src/app`: App-Shell, Router und Query-Client-Konfiguration
- `src/api`: gemeinsame HTTP-Infrastruktur
- `src/features`: fachliche Module fuer Auth, Administration, Dokumente und Suche
- `src/routes`: duenne Einstiegspunkte fuer TanStack Router
- `src/shared`: kleine, fachlich neutrale Hooks und Hilfsfunktionen

Jedes Feature kapselt seine API-Funktionen, React-Query-Hooks, Datentypen und
UI-Komponenten. Neue fachliche Logik sollte im jeweiligen Feature liegen und
nicht direkt in einer Route oder in `shared` abgelegt werden.

Der Dokumentbereich verwendet eine Workspace-Shell mit eigener Repository-
Navigation, Toolbar, zentraler Inhaltsflaeche und einem Properties-Inspector.
Navigation und Inspector lassen sich unabhaengig ein- und ausblenden und werden
auf kleineren Viewports als seitliche Overlays dargestellt.

## UI-Grundlagen

- `src/shared/styles/tokens.css` enthaelt semantische Light-/Dark-Tokens fuer
  Oberflaechen, Text, Rahmen, Akzente, Statusfarben, Radien und Schatten.
- `src/shared/components` enthaelt die nativen Basisbausteine wie Button,
  IconButton, Badge, SelectField und StateMessage.
- Der Theme-Schalter in der App-Shell speichert die Auswahl lokal im Browser.
- Markdown wird durch ein eigenes, tokenbasiertes Theme dargestellt; externe
  GitHub-Markdown-Styles sind nicht mehr Teil des Clients.

## Lokale Entwicklung

```bash
cd client
npm install
npm run dev
```

Weitere Kommandos:

```bash
npm run build
npm run lint
npm run preview
```

Standardmaessig laeuft das Frontend lokal auf `http://localhost:5173`.

## Verweise

- [../README.md](../README.md)
- [../server/README.md](../server/README.md)
