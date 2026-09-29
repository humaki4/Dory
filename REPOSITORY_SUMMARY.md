# Repository Analysis: docAtlas

## Overview

docAtlas ist eine Client-Server-Anwendung zum Erfassen, Indizieren, Durchsuchen und Anzeigen von Markdown-Dokumentation aus externen Repositories (aktuell primär GitHub).

Das Projekt adressiert ein häufiges Wissensproblem in Teams: Doku liegt verteilt über mehrere Repos, ist schwer auffindbar und inkonsistent strukturiert. docAtlas kombiniert deshalb Repository-Scanning, persistente Ablage in MongoDB und Volltextsuche in Meilisearch mit einer browserbasierten UI.

## Architecture

Das Repository ist als Monorepo mit vier Hauptbereichen organisiert:

- `client/`: React-Frontend (Vite, TypeScript, TanStack Router/Query) für Dokumentbrowser, Suche und Administration.
- `server/`: Fastify-Backend (TypeScript) mit modularem API-Aufbau über Autoload (`app.ts`).
- `docs/`: Produkt-/Feature-Dokumentation, Architektur-Notizen, Tasks und Referenzbeispiele.
- Infrastrukturdateien im Root (`docker-compose.yml`, `docker-compose.dev.yml`) zur lokalen bzw. containerisierten Laufzeit.

Die Runtime-Architektur laut Code und Compose-Dateien:

1. Frontend (`client`) ruft API-Endpunkte unter `/api/*` auf.
2. Backend (`server`) orchestriert Provider-Zugriff, Persistenz und Search.
3. MongoDB speichert Quellenmetadaten und Dateien (`document_sources`, `files`).
4. Meilisearch hält Suchindizes für schnelle Query-Ausführung.

## Key Components

- **Fastify App Bootstrapping (`server/app.ts`)**: Initialisiert Logger, MongoDB-Plugin, lädt Plugins und Module automatisch.
- **Documents-Modul (`server/modules/documents/*`)**: Liefert Repository-/Dateiansichten und Inhalte aus der persistierten Datengrundlage.
- **Collector-Modul (`server/modules/collector/*`)**: Scannt Repositories providerbasiert und schreibt normalisierte Daten in DB + Search-Index.
- **Search-Modul (`server/modules/search/*`)**: Bietet globale, space-bezogene und repo-bezogene Suche sowie Index-Stats.
- **Provider/Plugin-Layer (`server/plugins/*`)**: Meilisearch-Client, GitHub-Connector, EventBus und VCS-Abstraktion.
- **Document Browser UI (`client/src/views/documentBrowser/*`)**: Seitengerüst mit Searchbar, Navigation, Inhalts-/Verzeichnisansicht.
- **Administration UI (`client/src/views/administration/*`)**: Trigger für Repository-Scan und Provider-bezogene Verwaltungsfunktionen.
- **Query Layer (`client/src/hooks/useRepoQueries.ts`)**: Typed Fetch-Logik für Repos, Inhalte und Suche mit React Query Caching.

## Technologies Used

- **Languages**: TypeScript (Frontend + Backend), JavaScript (historische/alte Backend-Dateien), Markdown.
- **Frontend**: React 19, Vite 7, TanStack Router, TanStack Query, Radix UI, CSS Modules.
- **Backend**: Fastify 5, @fastify/autoload, @fastify/mongodb, dotenv.
- **Search**: Meilisearch (Plugin + modulare Search-Services).
- **Content Parsing**: gray-matter / front-matter für YAML Frontmatter.
- **Data Stores**: MongoDB + Meilisearch.
- **Infra/Delivery**: Docker, Docker Compose, Nginx im Client-Container.

## Data Flow

### Ingestion/Indexing

1. Administration stößt Scan an (`POST /api/collector/repositories/:space/:name/scan`).
2. Collector liest Repository-Inhalte über Provider-Implementierung (z. B. GitHub).
3. Markdown wird verarbeitet (inkl. Frontmatter/Metadaten-Extraktion).
4. Dokumentquellen und Dateiinhalte werden in MongoDB geschrieben.
5. Suchrelevante Dokumentdaten werden in Meilisearch indiziert.

### Browsing

1. Frontend lädt Repositories (`GET /api/documents/`).
2. Nutzer navigiert zu Datei-/Pfadansichten.
3. Inhalte werden über `GET /api/documents/content/:space/:name/*` geladen.
4. UI rendert Markdown, Metadaten, TOC und Kontextkomponenten.

### Search

1. Frontend sendet Query an `GET /api/search?search=...`.
2. Search-Service führt globale oder bereichsbezogene Suche in Meilisearch aus.
3. Treffer werden im Client gefiltert/aufbereitet (z. B. Typ, Tags, Autor, Repo).
4. Klick auf Ergebnis navigiert direkt in den passenden Dokumentpfad.
