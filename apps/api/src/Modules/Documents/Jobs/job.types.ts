// NOTE: background-job port.
//
// The queue (`document.jobs.ts`) orchestrates; handlers (`handlers/*`)
// own the per-document workflow. Controllers never touch jobs directly —
// they call `DocumentService.upload*()`, which enqueues. This keeps
// HTTP latency decoupled from parse/chunk/embed work.
//
// WHY one job per document: a failed document must never fail the rest
// of a batch, and retries stay isolated per document lifecycle
// (PENDING → PROCESSING → COMPLETED | FAILED).

/** Unit of background work: exactly one document lifecycle. */
export interface DocumentJob {
  documentId: string;
  projectId: string;
  providerName?: unknown;
  providerKey?: unknown;
}

export type DocumentJobHandler = (job: DocumentJob) => Promise<unknown>;

/** Number of documents requeued from a previous shutdown. */
export type RecoveryResult = number;
