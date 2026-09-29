import type {
  CollectorDocumentProcessedEvent,
  CollectorRepositorySyncCompletedEvent,
} from '../../modules/collector/events';

export interface DocAtlasEventMap {
  'collector.document.processed': CollectorDocumentProcessedEvent;
  'collector.repository.sync.completed': CollectorRepositorySyncCompletedEvent;
}
