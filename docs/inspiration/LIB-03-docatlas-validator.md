# @docatlas/validator

## Ziel

`@docatlas/validator` prüft Markdown-Artefakte gegen `@docatlas/spec` und nutzt `@docatlas/core` für Parsing/Normalisierung/Referenzlogik.

Er liefert klare, CI-taugliche Ergebnisse:
- Fehler
- Warnungen
- Hinweise
- maschinenlesbare Reports (JSON, SARIF)

---

## Scope (v0.1)

- Datei- und Workspace-Validierung
- Schema-Checks pro Dokumenttyp
- Semantik-Checks (z. B. fehlende Referenzziele)
- CLI + JS API
- Exit Codes für CI

---

## Paketstruktur (Vorschlag)

```text
packages/validator/
  src/
    validateFile.ts
    validateWorkspace.ts
    rules/
      schemaRule.ts
      requiredFieldsRule.ts
      referenceExistsRule.ts
      dateFormatRule.ts
    formatters/
      jsonFormatter.ts
      sarifFormatter.ts
      textFormatter.ts
    cli/
      index.ts
      commands/
        validate.ts
        lint.ts
        explain.ts
    index.ts
  package.json
```

---

## Konkrete Umsetzungsschritte

1. **Validation Result Model definieren**
   - `severity`, `code`, `message`, `path`, `line`, `column`, `suggestion?`
2. **Schema-Regel mit AJV implementieren**
3. **Semantik-Regeln ergänzen**
   - ID eindeutig?
   - Referenzziel vorhanden?
   - Status gültig?
4. **Formatter bauen**
   - human-readable text
   - JSON
   - SARIF
5. **CLI umsetzen**
   - `docatlas validate [path]`
   - `--format text|json|sarif`
   - `--fail-on warning|error`
6. **CI-Beispiele dokumentieren**
   - GitHub Actions / GitLab CI

---

## API-Idee (TypeScript)

- `validateFile(filePath, options): ValidationReport`
- `validateWorkspace(rootPath, options): ValidationReport`
- `formatReport(report, "json" | "sarif" | "text"): string`

---

## Exit-Code-Konzept

- `0`: keine Fehler
- `1`: Fehler gefunden
- `2`: CLI/Config-Fehler

---

## Ergebnis für Nutzer

- direkte Qualitätskontrolle im Editor und in CI
- verlässliche Datenbasis für alle Folge-Tools
- verständliche Hinweise statt nur „invalid“