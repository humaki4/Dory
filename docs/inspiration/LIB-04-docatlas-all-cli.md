# @docatlas/all (inkl. CLI)

## Ziel

`@docatlas/all` ist die **Install-once-Distribution** für Teams, die sofort produktiv starten wollen.  
Es bündelt die modularen Pakete:

- `@docatlas/spec`
- `@docatlas/core`
- `@docatlas/validator`
- `@docatlas/sources` (z. B. `filesystem`, `github`, `gitlab`)

Zusätzlich enthält es die CLI `docatlas`.

---

## Warum `all`?

Die internen Module bleiben sauber getrennt, aber nach außen entsteht ein einfaches UX-Modell:

- einmal installieren
- sofort validieren, linten, migrieren, graphen
- optional später Feintuning mit Einzelpaketen

Leitprinzip: **Monolithische Distribution, modulare Interna.**

---

## Lieferumfang (v0.1)

1. **CLI-Binary `docatlas`**
2. Default-Konfiguration (`docatlas.config.json`)
3. Standard-Specs + Templates
4. Validierung + Reports (text/json/sarif)
5. Basis-Sources:
   - `filesystem`
   - `github` (read-only)
   - `gitlab` (read-only)

---

## CLI-Kommandos (Vorschlag)

- `docatlas init`
  - legt Konfig, Template-Ordner und Beispielartefakte an
- `docatlas validate [path]`
  - prüft Markdown + Frontmatter gegen Spec
- `docatlas lint [path]`
  - Stil- und Qualitätsregeln
- `docatlas migrate [path] --to <specVersion>`
  - hebt alte Dokumente auf neue Spec-Version
- `docatlas graph [path] --format json`
  - erzeugt Referenz-/Abhängigkeitsgraph
- `docatlas sources sync`
  - lädt Inhalte aus konfigurierten Quellen

---

## Beispiel-Installation

```bash
npm install -D @docatlas/all
npx docatlas init
npx docatlas validate docs/
```

Optional global:

```bash
npm install -g @docatlas/all
docatlas validate .
```

---

## Beispiel-Konfiguration

```json
{
  "specVersion": "0.1.0",
  "include": ["docs/**/*.md"],
  "exclude": ["**/node_modules/**", "**/.git/**"],
  "sources": [{ "type": "filesystem", "root": "./docs" }],
  "validation": {
    "failOn": "error",
    "output": "text"
  }
}
```

---

## Ideen zur Verwendung

## 1) Lokal auf Entwicklerrechnern

- vor jedem Commit: `docatlas validate`
- schnelle Qualitätsrückmeldung ohne CI-Wartezeit
- einheitlicher Standard im Team

## 2) VS Code Integration

### a) Task für manuelle Prüfung

`.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "docatlas: validate docs",
      "type": "shell",
      "command": "npx docatlas validate docs --format text",
      "group": "test",
      "problemMatcher": []
    }
  ]
}
```

### b) On-save / Watch-Workflow (optional)

- `npx docatlas validate docs --watch`
- sinnvoll für Autoren, die viel direkt in Markdown arbeiten

## 3) Git Hooks

Mit `pre-commit` oder `husky`:

- nur geänderte Markdown-Dateien validieren
- verhindert fehlerhafte Frontmatter-Einträge im Hauptbranch

## 4) CI/CD Pipeline

- Pull Request Gate: `docatlas validate --format sarif`
- Ergebnis als Artefakt/Code-Scanning veröffentlichen
- optional `docatlas migrate --check` für Versionsdisziplin

Beispiel (GitHub Actions Schritt):

```yaml
- name: Validate docs
  run: npx docatlas validate docs --format sarif --output reports/docatlas.sarif
```

## 5) Plattform-/Repo-übergreifende Nutzung

- Teams mit GitHub/GitLab können dieselbe Spec verwenden
- Tooling austauschbar, Datenformat stabil
- ideal für „User owns the data“-Strategie

---

## Abgrenzung zu Einzelpaketen

- `@docatlas/all`: für schnelle Adoption, Standards im Team
- Einzelpakete: für Integratoren, Plattformteams, Spezialfälle

Beide Wege bleiben kompatibel.

---

## Definition of Done (v0.1)

- Install + `init` in < 2 Minuten
- `validate` funktioniert ohne Zusatzkonfiguration auf Beispielrepo
- text/json/sarif-Ausgabe stabil
- Dokumentierte VS Code + CI Beispiele vorhanden
