---
title: "Migration Plan: Local Git Provider"
description: "Schrittweise Migration von GitHub-only auf umschaltbaren GitHub/Local-Provider im Server"
date: 2026-03-13
tags: [migration, architecture, auth, collector, git, local-provider]
---

# Migration Plan: Local Git Provider

## Ziel

Neben dem bestehenden GitHub-Provider soll ein zweiter Git-Provider eingeführt werden, der lokale Git-Repositories einlesen kann. Welcher Provider aktiv ist, soll beim Start des Servers über eine zentrale Umgebungsvariable gesteuert werden.

Alle Funktionen, die heute nur mit GitHub funktionieren, sollen auch mit lokalen Repositories bedient werden können.

## Wichtige Randbedingung

Die aktuelle Anwendung ist eine Browser-App. Ein nativer File-Dialog kann dem Server keinen dauerhaft später wiederverwendbaren lokalen Repository-Pfad liefern. Deshalb basiert dieser Migrationsplan im lokalen Modus auf serverseitiger Pfadangabe und Validierung, nicht auf einem echten nativen Datei-Dialog.

## Zielbild

- Eine zentrale Env-Variable steuert den aktiven Provider-Modus.
- Im `github`-Modus bleibt der bestehende OAuth-Flow aktiv.
- Im `local`-Modus läuft der Server ohne OAuth-Login.
- Der Collector kann abhängig vom aktiven Provider entweder GitHub-Repositories oder lokale Git-Repositories lesen.
- Dokumente und Quellen werden weiterhin in dieselben MongoDB-Collections geschrieben.
- Das Frontend zeigt je nach aktivem Provider den passenden Einstieg.

## Bestehende Architektur

### Bereits brauchbare Abstraktionen

Die VCS-Schnittstelle in `server/modules/collector/vcsProvider/IVcsProvider.ts` ist grundsätzlich geeignet, um neben GitHub auch einen lokalen Provider zu unterstützen.

Die Persistenz über `document_sources2` und `documents2` ist bereits providerneutral genug, um auch lokale Quellen aufzunehmen.

### Aktuelle Probleme

#### 1. Auth ist noch zu stark auf OAuth zugeschnitten

Die aktuelle Provider-Schicht unter `server/modules/auth/providers` modelliert nur OAuth-Anbieter. Ein lokaler Provider passt fachlich nicht sauber in dieses Modell.

#### 2. Repository-Access ist falsch abstrahiert

In `server/plugins/repositoryAccess/service.ts` ist Berechtigung direkt an GitHub gekoppelt. Dort wird aktuell explizit geprüft, ob `user.provider === 'github'` ist. Damit können andere Provider nicht sauber funktionieren.

#### 3. Token-Handling ist GitHub-spezifisch

In `server/plugins/auth/auth.ts` existieren Methoden wie `setGithubAccessToken` und `getGithubAccessToken`. Das ist für austauschbare Provider zu eng.

#### 4. Collector-VCS-Provider ist statisch verdrahtet

In `server/modules/collector/vcsProvider/index.ts` wird derzeit ausschließlich GitHub unterstützt. Andere Provider führen direkt zu einem Startfehler.

#### 5. Frontend ist GitHub-only

Die Login- und Einstiegskomponenten erwarten ausschließlich GitHub und bieten derzeit keinen lokalen Flow.

## Migrationsstrategie

Die Migration erfolgt in kleinen, überprüfbaren Schritten. Nach jedem Schritt soll ein Zwischenstand prüfbar sein.

## Schritt 1: Provider-Konfiguration vereinheitlichen

### Ziel

Eine zentrale Server-Konfiguration definiert, welcher Provider aktiv ist.

### Änderung

- Einführung einer zentralen Umgebungsvariable, empfohlen:
  - `DOCATLAS_PROVIDER=github`
  - `DOCATLAS_PROVIDER=local`
- Alle direkten Reads von `process.env.PROVIDER_TYPE || 'github'` werden durch eine zentrale Config-Funktion ersetzt.
- Der unterstützte Provider-Typ wird an einer Stelle definiert und von Auth, Collector und Repository-Access gemeinsam verwendet.

### Ergebnis

Der Server kennt einen klaren aktiven Betriebsmodus und validiert die notwendige Konfiguration früh beim Start.

### Stoppkriterium

- Server startet im GitHub-Modus mit GitHub-Konfiguration.
- Server startet im Local-Modus ohne GitHub-Konfiguration.
- Ungültige Provider-Werte führen zu klaren Fehlermeldungen.

## Schritt 2: Auth in zwei Modi aufteilen

### Ziel

GitHub nutzt weiterhin OAuth, der lokale Modus läuft ohne Login.

### Änderung

- Der bestehende GitHub-OAuth-Flow bleibt erhalten.
- Für den lokalen Modus wird ein einfacher Session-Bootstrap eingeführt.
- Der lokale Benutzer kann serverseitig mit festen Rollen erzeugt werden.
- GitHub-spezifische Token-Methoden werden generisch gemacht oder im lokalen Modus bewusst umgangen.

### Ergebnis

`/api/auth/whoami` liefert in beiden Modi ein konsistentes Benutzerobjekt.

### Stoppkriterium

- GitHub-Login funktioniert unverändert.
- Local-Modus benötigt keinen OAuth-Redirect.
- Geschützte Endpunkte bekommen auch im Local-Modus einen gültigen Benutzerkontext.

## Schritt 3: Repository-Access korrekt abstrahieren

### Ziel

Autorisierung darf nicht mehr GitHub-spezifisch sein.

### Änderung

- Einführung eines providerabhängigen Repository-Access-Resolvers.
- GitHub nutzt weiterhin API-basierte Rechteprüfung.
- Local prüft gegen lokal registrierte Quellen in MongoDB.
- Die harte Prüfung auf `user.provider === 'github'` entfällt.

### Ergebnis

Alle Endpunkte, die heute `authorize()` verwenden, funktionieren providerabhängig.

### Stoppkriterium

- Dokumentlisten funktionieren in beiden Modi.
- Repository-Lesezugriff funktioniert in beiden Modi.
- Kein Endpunkt bricht mehr wegen GitHub-Hardcoding.

## Schritt 4: Local VCS Provider implementieren

### Ziel

Ein zweiter `IVcsProvider` liest lokale Git-Repositories vom Dateisystem.

### Änderung

- Neue Implementierung parallel zum bestehenden GitHub-Provider.
- Validierung, dass ein übergebener Pfad ein Git-Repository ist.
- Rekursives Lesen von Markdown-Dateien.
- Mapping auf dieselben Typen wie beim GitHub-Provider:
  - `RepositoryMetadata`
  - `FileContent`

### Offene technische Entscheidung

Falls Metadaten wie Autor, Erstellungszeit oder letzte Änderung exakt aus Git benötigt werden, ist voraussichtlich eine zusätzliche Git-Bibliothek notwendig. Falls das zunächst nicht zwingend ist, kann der erste Schritt pragmatisch mit Dateisystemdaten oder letztem Commit erfolgen.

### Ergebnis

Der Collector kann lokale Repositories wie GitHub-Repositories behandeln.

### Stoppkriterium

- Lokale Repositories können geladen werden.
- Markdown-Dateien werden korrekt erkannt.
- Inhalte können vom Collector verarbeitet werden.

## Schritt 5: VCS-Provider-Plugin austauschbar machen

### Ziel

Die Auswahl des VCS-Providers erfolgt zur Laufzeit über Konfiguration.

### Änderung

- Umbau von `server/modules/collector/vcsProvider/index.ts` zu einer echten Provider-Factory.
- GitHub-Provider wird nur im GitHub-Modus geladen.
- Local-Provider wird nur im Local-Modus geladen.
- Die Pflichtkonfiguration wird je Modus validiert.

### Ergebnis

Der Collector ist providerfähig, ohne dass anderer Anwendungscode angepasst werden muss.

### Stoppkriterium

- Collector-Endpunkte funktionieren im GitHub-Modus.
- Collector-Endpunkte funktionieren im Local-Modus.
- Der Server startet nicht mit unvollständiger Pflichtkonfiguration.

## Schritt 6: Registrierung lokaler Repositories und Mongo-Persistenz

### Ziel

Lokale Repositories sollen ähnlich wie GitHub-Repositories im System registriert und erneut gescannt werden können.

### Änderung

- Neue API zum Registrieren eines lokalen Git-Pfads.
- Validierung des Pfads auf Existenz, Zugriff und Git-Repository-Struktur.
- Ableitung von:
  - `space`
  - `name`
  - `fullName`
  - `provider`
  - `url`
  - `defaultBranch`
- Integration in denselben Persistenzfluss wie bisher über `document_sources2`.

### Ergebnis

Lokale Quellen tauchen wie GitHub-Quellen in MongoDB auf und können später erneut synchronisiert werden.

### Stoppkriterium

- Gültige lokale Repositories können registriert werden.
- Ungültige Pfade werden sauber abgelehnt.
- Registrierte lokale Repositories erscheinen in `document_sources2`.

## Schritt 7: Frontend an den Provider-Modus anpassen

### Ziel

Die UI darf nicht mehr GitHub-only sein.

### Änderung

- GitHub-Modus:
  - bestehender Login bleibt sichtbar
- Local-Modus:
  - stattdessen UI für lokale Repository-Registrierung
- Providerabhängige Texte und Call-to-Actions
- Repository-Listen sollen lokal registrierte Quellen anzeigen

### Ergebnis

Das Frontend passt seinen Einstiegspfad an den aktiven Provider an.

### Stoppkriterium

- Startseite ist im GitHub-Modus korrekt.
- Startseite ist im Local-Modus korrekt.
- Nutzer können lokale Quellen registrieren und anschließend scannen.

## Schritt 8: End-to-End-Verifikation

### Ziel

Sicherstellen, dass beide Modi vollständig funktionieren.

### Zu prüfen

- Auth-Flow im GitHub-Modus
- Session-Verhalten im Local-Modus
- Registrierung lokaler Quellen
- Scan von GitHub-Repositories
- Scan lokaler Repositories
- Persistenz in `documents2`
- Persistenz in `document_sources2`
- Anzeige in Dokumentliste und Detailansicht

### Stoppkriterium

Ein vollständiger Ablauf funktioniert in beiden Modi vom Einstieg bis zur Dokumentanzeige.

## Schritt 9: Tests und Dokumentation

### Ziel

Die Migration soll reproduzierbar abgesichert und dokumentiert werden.

### Änderung

- Tests für Provider-Umschaltung
- Tests für lokalen Auth-Modus
- Tests für Local VCS Provider
- Tests für Repository-Access mit beiden Providern
- Dokumentation der neuen Env-Variable
- Dokumentation des lokalen Registrierungsflows
- Dokumentation der Browser-Einschränkung bezüglich nativer Dateidialoge

### Ergebnis

Der neue Provider-Modus ist wartbar und verständlich dokumentiert.

## Betroffene Hauptbereiche

### Auth

- `server/modules/auth/providers/github-provider.ts`
- `server/modules/auth/providers/provider.ts`
- `server/modules/auth/oauth-flow-service.ts`
- `server/modules/auth/routes.ts`
- `server/modules/auth/config.ts`
- `server/modules/auth/types.ts`
- `server/plugins/auth/auth.ts`

### Repository Access

- `server/plugins/repositoryAccess/service.ts`
- `server/plugins/repositoryAccess/repositoryAccess.ts`
- `server/plugins/repositoryAccess/github.ts`

### Collector / VCS

- `server/modules/collector/vcsProvider/IVcsProvider.ts`
- `server/modules/collector/vcsProvider/index.ts`
- `server/modules/collector/vcsProvider/implementations/github.ts`
- `server/modules/collector/service.ts`
- `server/modules/collector/routes.ts`

### Documents / Persistenz

- `server/modules/documents/ingestService.ts`
- `server/modules/documents/browseService.ts`

### Client

- `client/src/hooks/useAuthSession.ts`
- `client/src/routes/index.tsx`

## Risiken

### Architektur-Risiken

- Der aktuelle Auth-Provider-Vertrag ist nur für OAuth entworfen.
- Das Repository-Access-Plugin ist derzeit die stärkste Fehlkopplung an GitHub.
- Der lokale Provider benötigt klare Regeln für Zugriff und Sichtbarkeit.

### Produkt-Risiken

- Ein echter nativer Datei-Dialog ist im Browser-Setup nicht belastbar.
- Falls echte Git-Historieninformationen benötigt werden, steigt der technische Aufwand.

## Entscheidungen in diesem Plan

- Es gibt genau eine zentrale Env-Variable für den aktiven Provider.
- Der lokale Modus läuft ohne Login.
- Lokale Repositories werden serverseitig per Pfadangabe registriert.
- Mischbetrieb von GitHub und Local in derselben Serverinstanz ist nicht Teil dieses Migrationsschritts.
- Der bestehende Mongo-Persistenzpfad wird wiederverwendet.

## Nicht Teil dieses Plans

- Gleichzeitiger Parallelbetrieb mehrerer Provider in einer Instanz
- Native Desktop-Integration
- Electron- oder Tauri-basierter Datei-Dialog
- Vollständige Mehrmandantenfähigkeit für lokale Pfade

## Empfehlung

Die Migration sollte mit der Bereinigung der Provider-Konfiguration und der Repository-Access-Abstraktion beginnen. Das sind die beiden Grundlagen, ohne die ein lokaler Provider zwar implementiert, aber nicht sauber in das bestehende System integrierbar wäre.
