---
title: "Implementation Guide: Generic Document Interpretation Layer"
description: "Technisches Design für austauschbare Frontend-Interpretation von Markdown+Frontmatter"
date: 2026-02-21
status: "draft"
type: "design"
tags: [architecture, typescript, frontend, api-design]
author: "Engineering Team"
version: "1.0"
---

# Implementation Guide: Generic Document Interpretation Layer

## Architektur-Prinzip

**"Dateien sind die Wahrheit, UI interpretiert nur"**

Frontend und Backends können jederzeit ausgetauscht werden, solange sie das gemeinsame Frontmatter-Schema verstehen.

---

## 1. Core Type System (Generic)

```typescript
// src/types/core/Document.ts
export interface Document {
  id: string;
  title: string;
  description?: string;
  type: string; // Intentionally string, not enum
  content: string;
  metadata: FrontmatterMetadata;
  source: DocumentSource;
}

export interface FrontmatterMetadata {
  [key: string]: any; // Vollständig flexibel

  // Well-known fields (optional)
  status?: string;
  priority?: string;
  tags?: string[];
  created?: Date;
  updated?: Date;
  owner?: string;
}

export interface DocumentSource {
  repository: string;
  path: string;
  branch: string;
  commit: string;
  lastModified: Date;
}
```

**Design-Entscheidung:** `type` ist bewusst `string`, kein Enum → neue Typen können ohne Code-Änderung hinzugefügt werden.

---

## 2. Interpretation Layer (Adapter Pattern)

```typescript
// src/interpreters/BaseDocumentInterpreter.ts
export abstract class BaseDocumentInterpreter<T> {
  abstract canHandle(doc: Document): boolean;
  abstract interpret(doc: Document): T;

  protected getMetadata<K>(doc: Document, key: string): K | undefined {
    return doc.metadata[key] as K;
  }

  protected requireMetadata<K>(doc: Document, key: string): K {
    const value = this.getMetadata<K>(doc, key);
    if (value === undefined) {
      throw new Error(`Required metadata field '${key}' missing in ${doc.id}`);
    }
    return value;
  }
}

// src/interpreters/PMDocumentInterpreter.ts
export type PMStatus =
  | "planned"
  | "ready"
  | "in-progress"
  | "blocked"
  | "done"
  | "cancelled";

export type PMType = "epic" | "feature" | "story" | "task" | "subtask" | "bug";

export interface PMDocument extends Document {
  type: PMType;
  status: PMStatus;
  priority?: "low" | "medium" | "high" | "critical";
  sprint?: string;
  story_points?: number;
  estimate_hours?: number;
  owner?: string;
  team?: string;
  linked?: {
    parent?: string;
    children?: string[];
    blocks?: string[];
    blocked_by?: string[];
  };
}

export class PMDocumentInterpreter extends BaseDocumentInterpreter<PMDocument> {
  private readonly PM_TYPES: Set<string> = new Set([
    "epic",
    "feature",
    "story",
    "task",
    "subtask",
    "bug",
    "backlog",
    "sprint",
    "meeting-notes",
  ]);

  canHandle(doc: Document): boolean {
    return this.PM_TYPES.has(doc.type.toLowerCase());
  }

  interpret(doc: Document): PMDocument {
    return {
      ...doc,
      type: this.normalizeType(doc.type),
      status: this.normalizeStatus(
        this.getMetadata(doc, "status") || "planned",
      ),
      priority: this.getMetadata(doc, "priority"),
      sprint: this.getMetadata(doc, "sprint"),
      story_points: this.getMetadata(doc, "story_points"),
      estimate_hours: this.getMetadata(doc, "estimate_hours"),
      owner: this.getMetadata(doc, "owner"),
      team: this.getMetadata(doc, "team"),
      linked: this.getMetadata(doc, "linked"),
    };
  }

  private normalizeType(type: string): PMType {
    const normalized = type.toLowerCase();
    if (!this.PM_TYPES.has(normalized)) {
      return "task"; // Safe fallback
    }
    return normalized as PMType;
  }

  private normalizeStatus(status: string): PMStatus {
    const normalized = status.toLowerCase();
    const validStatuses: PMStatus[] = [
      "planned",
      "ready",
      "in-progress",
      "blocked",
      "done",
      "cancelled",
    ];

    if (validStatuses.includes(normalized as PMStatus)) {
      return normalized as PMStatus;
    }

    // Status mapping for common variations
    const statusMap: Record<string, PMStatus> = {
      todo: "planned",
      backlog: "planned",
      open: "ready",
      active: "in-progress",
      wip: "in-progress",
      closed: "done",
      completed: "done",
      resolved: "done",
    };

    return statusMap[normalized] || "planned";
  }
}
```

---

## 3. Interpreter Registry (Plugin System)

```typescript
// src/interpreters/InterpreterRegistry.ts
export class InterpreterRegistry {
  private interpreters: BaseDocumentInterpreter<any>[] = [];

  register<T>(interpreter: BaseDocumentInterpreter<T>): void {
    this.interpreters.push(interpreter);
  }

  interpret<T = Document>(doc: Document): T {
    for (const interpreter of this.interpreters) {
      if (interpreter.canHandle(doc)) {
        return interpreter.interpret(doc) as T;
      }
    }

    // Fallback: return as generic Document
    return doc as T;
  }

  interpretMany<T = Document>(docs: Document[]): T[] {
    return docs.map((doc) => this.interpret<T>(doc));
  }
}

// src/interpreters/index.ts
import { InterpreterRegistry } from "./InterpreterRegistry";
import { PMDocumentInterpreter } from "./PMDocumentInterpreter";
import { TechnicalDocInterpreter } from "./TechnicalDocInterpreter";

export const registry = new InterpreterRegistry();

// Register built-in interpreters
registry.register(new PMDocumentInterpreter());
registry.register(new TechnicalDocInterpreter());

// Allow custom interpreters via plugin system
export function registerCustomInterpreter<T>(
  interpreter: BaseDocumentInterpreter<T>,
): void {
  registry.register(interpreter);
}
```

---

## 4. API Layer (Generic)

```typescript
// server/modules/documents/routes.ts
interface GetDocumentsQuery {
  type?: string;
  status?: string;
  tags?: string[];
  repo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

fastify.get("/api/documents", async (request, reply) => {
  const query = request.query as GetDocumentsQuery;

  // Generic filtering - no PM-specific logic here
  const filters: any = {};

  if (query.type) filters["metadata.type"] = query.type;
  if (query.status) filters["metadata.status"] = query.status;
  if (query.tags) filters["metadata.tags"] = { $in: query.tags };
  if (query.repo) filters["source.repository"] = query.repo;

  const documents = await documentsCollection.find(filters);

  return {
    documents,
    total: documents.length,
    page: query.page || 1,
    limit: query.limit || 50,
  };
});

fastify.patch("/api/documents/:id", async (request, reply) => {
  const { id } = request.params;
  const updates = request.body;

  // Generic update - writes back to Git
  const doc = await documentsCollection.findOne({ id });

  if (!doc) {
    return reply.status(404).send({ error: "Document not found" });
  }

  // Update frontmatter
  const updatedMetadata = {
    ...doc.metadata,
    ...updates,
    updated: new Date().toISOString(),
  };

  // Write back to Git
  await gitService.updateFrontmatter({
    repo: doc.source.repository,
    path: doc.source.path,
    branch: doc.source.branch,
    metadata: updatedMetadata,
    commitMessage: `Update ${id}: ${Object.keys(updates).join(", ")}`,
  });

  return { success: true, updated: Object.keys(updates) };
});
```

---

## 5. Frontend Usage (React)

```typescript
// src/hooks/useDocuments.ts
import { useQuery } from '@tanstack/react-query';
import { registry } from '@/interpreters';
import type { Document } from '@/types/core/Document';
import type { PMDocument } from '@/interpreters/PMDocumentInterpreter';

export function useDocuments<T = Document>(filters: {
  type?: string;
  status?: string;
  tags?: string[];
}) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const response = await fetch('/api/documents?' + new URLSearchParams(filters));
      const data = await response.json();

      // Interpret documents based on their type
      return registry.interpretMany<T>(data.documents);
    },
  });
}

// src/views/pm/SprintBoard.tsx
import { useDocuments } from '@/hooks/useDocuments';
import type { PMDocument } from '@/interpreters/PMDocumentInterpreter';

export function SprintBoard({ sprintId }: { sprintId: string }) {
  const { data: tasks } = useDocuments<PMDocument>({
    type: 'task',
    // sprint filtering happens via custom metadata
  });

  // Filter by sprint (generic metadata field)
  const sprintTasks = tasks?.filter(task => task.sprint === sprintId) || [];

  // Group by status (generic metadata interpretation)
  const tasksByStatus = {
    ready: sprintTasks.filter(t => t.status === 'ready'),
    'in-progress': sprintTasks.filter(t => t.status === 'in-progress'),
    done: sprintTasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="sprint-board">
      {Object.entries(tasksByStatus).map(([status, tasks]) => (
        <Column key={status} title={status} tasks={tasks} />
      ))}
    </div>
  );
}
```

---

## 6. Austauschbarkeit: Alternative Clients

### CLI Tool

```bash
# docatlas-cli (nutzt die gleiche API)
$ docatlas task list --status in-progress --sprint SPRINT-2026-06

TASK-339  | Implement Search Facets API        | alex  | 3 pts
TASK-341  | Optimize Query Performance         | deniz | 5 pts

$ docatlas task update TASK-339 --status done
✓ Updated TASK-339 in Git and triggered sync
```

### VS Code Extension

```typescript
// vscode-docatlas/src/extension.ts
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "docatlas.updateTaskStatus",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const document = editor.document;
      const text = document.getText();

      // Parse frontmatter
      const frontmatter = parseFrontmatter(text);

      // Show status picker
      const newStatus = await vscode.window.showQuickPick([
        "planned",
        "ready",
        "in-progress",
        "blocked",
        "done",
        "cancelled",
      ]);

      if (!newStatus) return;

      // Update frontmatter in place
      const updatedText = updateFrontmatter(text, { status: newStatus });

      // Apply edit
      const edit = new vscode.WorkspaceEdit();
      edit.replace(
        document.uri,
        new vscode.Range(0, 0, document.lineCount, 0),
        updatedText,
      );

      await vscode.workspace.applyEdit(edit);
      await document.save();
    },
  );

  context.subscriptions.push(disposable);
}
```

### Obsidian Plugin

```typescript
// obsidian-docatlas/main.ts
import { Plugin, TFile } from "obsidian";

export default class DocAtlasPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "create-task",
      name: "Create New Task",
      callback: async () => {
        const title = await this.promptForInput("Task Title");
        const template = `---
id: "TASK-${Date.now()}"
title: "${title}"
type: "task"
status: "planned"
priority: "medium"
created: ${new Date().toISOString()}
---

# ${title}

## Description

(Add description here)

## Acceptance Criteria

- [ ] 

## Related

- 
`;

        const file = await this.app.vault.create(
          `tasks/TASK-${Date.now()}.md`,
          template,
        );

        this.app.workspace.openLinkText(file.path, "", true);
      },
    });
  }
}
```

---

## 7. Extension Mechanism: Custom Types

```typescript
// User-Repository: .docatlas/types.ts
import { registerCustomInterpreter } from "@docatlas/core";
import { BaseDocumentInterpreter } from "@docatlas/core";

interface CustomerFeedbackDoc extends Document {
  type: "customer-feedback";
  customer_id: string;
  satisfaction_score: number;
  product_area: string;
}

class CustomerFeedbackInterpreter extends BaseDocumentInterpreter<CustomerFeedbackDoc> {
  canHandle(doc: Document): boolean {
    return doc.type === "customer-feedback";
  }

  interpret(doc: Document): CustomerFeedbackDoc {
    return {
      ...doc,
      type: "customer-feedback",
      customer_id: this.requireMetadata(doc, "customer_id"),
      satisfaction_score: this.requireMetadata(doc, "satisfaction_score"),
      product_area: this.getMetadata(doc, "product_area") || "general",
    };
  }
}

// Register custom interpreter
registerCustomInterpreter(new CustomerFeedbackInterpreter());
```

---

## 8. Standards Compliance Check

```typescript
// src/validation/PMStandardValidator.ts
export class PMStandardValidator {
  private readonly REQUIRED_FIELDS = ["id", "title", "type", "status"];
  private readonly VALID_STATUSES = [
    "planned",
    "ready",
    "in-progress",
    "blocked",
    "done",
    "cancelled",
  ];

  validate(doc: Document): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    for (const field of this.REQUIRED_FIELDS) {
      if (!doc.metadata[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate status
    const status = doc.metadata.status;
    if (status && !this.VALID_STATUSES.includes(status)) {
      warnings.push(
        `Non-standard status '${status}'. ` +
          `Recommended: ${this.VALID_STATUSES.join(", ")}`,
      );
    }

    // Check ID format
    if (doc.metadata.id && !doc.metadata.id.match(/^[A-Z]+-\d+$/)) {
      warnings.push(
        `ID '${doc.metadata.id}' doesn't follow convention. ` +
          `Recommended format: TYPE-123`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
```

---

## 9. Import/Export (Jira Compatibility)

```typescript
// src/integrations/JiraAdapter.ts
export class JiraAdapter {
  /**
   * Convert docAtlas Markdown to Jira JSON
   */
  toJira(doc: PMDocument): JiraIssue {
    return {
      fields: {
        summary: doc.title,
        description: doc.content,
        issuetype: { name: this.mapType(doc.type) },
        status: { name: this.mapStatus(doc.status) },
        priority: { name: doc.priority || "Medium" },
        labels: doc.metadata.tags || [],
        customfield_10016: doc.story_points, // Story Points
        assignee: { name: doc.owner },
      },
    };
  }

  /**
   * Convert Jira JSON to docAtlas Markdown
   */
  fromJira(issue: JiraIssue): string {
    const metadata = {
      id: issue.key,
      title: issue.fields.summary,
      type: this.mapJiraType(issue.fields.issuetype.name),
      status: this.mapJiraStatus(issue.fields.status.name),
      priority: issue.fields.priority.name.toLowerCase(),
      owner: issue.fields.assignee?.name,
      story_points: issue.fields.customfield_10016,
      tags: issue.fields.labels,
      created: issue.fields.created,
      updated: issue.fields.updated,
    };

    const frontmatter = YAML.stringify(metadata);

    return `---
${frontmatter}---

# ${issue.fields.summary}

${issue.fields.description || ""}
`;
  }

  private mapType(type: PMType): string {
    const map: Record<PMType, string> = {
      epic: "Epic",
      feature: "Epic",
      story: "Story",
      task: "Task",
      subtask: "Sub-task",
      bug: "Bug",
    };
    return map[type] || "Task";
  }

  private mapStatus(status: PMStatus): string {
    const map: Record<PMStatus, string> = {
      planned: "To Do",
      ready: "Ready",
      "in-progress": "In Progress",
      blocked: "Blocked",
      done: "Done",
      cancelled: "Cancelled",
    };
    return map[status];
  }
}
```

---

## 10. Zusammenfassung

### Was ist generisch? ✅

- **Core Document Model** → jedes System kann es verstehen
- **Frontmatter Parsing** → Standard YAML
- **API Endpoints** → REST mit generischen Filtern
- **Interpretation Layer** → Plugin-System

### Was ist docAtlas-spezifisch? 🎯

- **UI Components** (Kanban, Burndown) → aber interpretiert nur Metadaten
- **PM-Convenience API** → optional, basiert auf Generic API
- **Custom Extensions** → `x_docatlas_*` Namespaces

### Austauschbarkeit gewährleistet durch:

1. **Offenes Schema** (RFC-ähnlich dokumentiert)
2. **Adapter Pattern** (Interpreter können hinzugefügt werden)
3. **API-First** (CLI/Plugins nutzen die gleichen Endpoints)
4. **Git als Source of Truth** (Markdown kann direkt bearbeitet werden)

### Migration Path

**Weg 1: docAtlas → Jira**

```bash
$ docatlas export --format jira --output jira-import.json
$ jira-cli import jira-import.json
```

**Weg 2: Jira → docAtlas**

```bash
$ jira-cli export --format docatlas --output tasks/
$ git add tasks/ && git commit -m "Import from Jira"
```

**Weg 3: Parallel nutzen**

```bash
# docAtlas synchronisiert bidirektional mit Jira
$ docatlas sync jira --bidirectional
```

---

## Verwandte Dokumente

- [ANALYSIS: Markdown PM Strategy](./ANALYSIS-markdown-pm-strategy.md)
- [CONCEPT: Document Type System](./CONCEPT-document-type-system.md)
- [ADR-001: Architecture](./ADR-001-markdown-browser-architecture.md)
