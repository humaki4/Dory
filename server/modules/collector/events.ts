export interface CollectorDocumentProcessedEvent {
  eventType: 'collector.document.processed';
  provider: string;
  repository: {
    id: string;
    space: string;
    name: string;
    url: string;
    defaultBranch: string;
    isPrivate: boolean;
    updatedAt: string;
  };
  document: {
    path: string;
    url: string;
    hash: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    content: string;
    metadata: Record<string, unknown>;
  };
  collectedAt: string;
}

export interface CollectorRepositorySyncCompletedEvent {
  eventType: 'collector.repository.sync.completed';
  provider: string;
  repository: {
    id: string;
    space: string;
    name: string;
    url: string;
    defaultBranch: string;
    isPrivate: boolean;
    updatedAt: string;
  };
  branch?: string;
  pathPattern?: string;
  fullScan: boolean;
  paths: string[];
  collectedAt: string;
}
