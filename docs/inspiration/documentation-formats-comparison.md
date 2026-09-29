---
title: Vergleich Dokumentationsformate
author: Martina
date: 2026-02-20
tags: [markdown, asciidoc, restructuredtext, documentation, formats]
category: research
priority: high
---

# Dokumentationsformate im Vergleich

## Übersicht

Für das docAtlas-Tool sind drei Hauptformate relevant, die in Git-Repositories und Wikis vorkommen:

| Format               | Verbreitung      | Komplexität | Typischer Einsatz                  |
| -------------------- | ---------------- | ----------- | ---------------------------------- |
| **Markdown**         | Sehr hoch (80%+) | Niedrig     | README, GitHub/GitLab, Blogs       |
| **AsciiDoc**         | Mittel           | Mittel-Hoch | Enterprise-Doku, technische Bücher |
| **reStructuredText** | Mittel           | Mittel-Hoch | Python-Projekte, Sphinx            |

## Markdown

**Syntax-Beispiel:**

```markdown
# Heading

**Bold**, _italic_, `code`

- List item
  [Link](url)
```

**Eigenschaften:**

- Minimalistisch und intuitiv
- Hunderte von Implementierungen
- Standard für GitHub, GitLab, Dev-Plattformen
- Diagramme nur via Extensions (Mermaid, PlantUML)

**Rendering:** `marked`, `markdown-it`, `remark`

## AsciiDoc

**Syntax-Beispiel:**

```asciidoc
= Document Title
:toc: left

== Heading
*Bold*, _italic_, `code`

NOTE: Admonition block

[source,java]
----
code block
----
```

**Eigenschaften:**

- Erweiterte Features (Includes, Variablen, Conditionals)
- Native Unterstützung für Admonitions
- Beliebte bei großen Doku-Projekten (Spring, Red Hat)
- Eingebaute Diagramm-Unterstützung (PlantUML, Mermaid, Graphviz)

**Rendering:** `asciidoctor.js`, `asciidoctor` (Ruby/Java)

## reStructuredText (rST)

**Syntax-Beispiel:**

```restructuredtext
Document Title
==============

Heading
-------

**Bold**, *italic*, ``code``

.. note::
   Admonition block

.. code-block:: python

   print("hello")
```

**Eigenschaften:**

- Strenge, explizite Syntax
- Standard in Python-Ökosystem
- Sphinx ist das primäre Tool
- Stark in API-Dokumentation

**Rendering:** `restructured` (npm), `docutils` (Python)

## Diagramme

| Format   | Diagramm-Support                    |
| -------- | ----------------------------------- |
| Markdown | Mermaid, PlantUML (via Extensions)  |
| AsciiDoc | PlantUML, Mermaid, Graphviz (nativ) |
| rST      | PlantUML, Graphviz (via Sphinx)     |

**Mermaid** ist am weitesten verbreitet und wird von GitHub/GitLab nativ gerendert.

## Empfehlung für docAtlas

### Phase 1: MVP

- **Markdown** + **Mermaid-Diagramme**
- Deckt ~80% aller Dokumentationen ab
- Einfachste Implementierung

### Phase 2: Enterprise-Readiness

- **AsciiDoc** hinzufügen
- Erweitert Abdeckung auf ~95%
- Wichtig für GitLab-Wikis und größere Doku-Projekte

### Phase 3: Python-Ökosystem

- **reStructuredText** optional
- Nur bei explizitem Bedarf (Python-Heavy-Projekte)

## GitLab Wiki-Formate

GitLab-Wikis (CE + EE) unterstützen:

- `.md` (Markdown) — **Standard**
- `.adoc`, `.asciidoc` (AsciiDoc)
- `.rst` (reStructuredText)
- `.rdoc`, `.org` (selten)

**Wichtig:** Wikis liegen in separatem Git-Repo: `project.wiki.git`

## Open Source & Lizenzierung

Alle drei Formate sind:

- ✅ Open Source
- ✅ Frei verwendbar
- ✅ Aktiv maintained
- ✅ Große Community

## Technische Integration

```javascript
// Markdown
import { marked } from "marked";
const html = marked(markdownString);

// AsciiDoc
import asciidoctor from "asciidoctor";
const doc = asciidoctor.convert(asciidocString);

// reStructuredText
import { parse } from "restructured";
const ast = parse(rstString);
```

## Ressourcen

- [CommonMark Spec](https://commonmark.org/)
- [AsciiDoc Syntax](https://docs.asciidoctor.org/asciidoc/latest/)
- [reStructuredText Primer](https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html)
- [Mermaid Docs](https://mermaid.js.org/)

---

**Fazit:** Start mit Markdown, dann AsciiDoc. Das deckt praktisch alle relevanten Use Cases ab.
