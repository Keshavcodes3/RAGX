// NOTE: document-processing job handler.
//
// The worker (`document.jobs.ts:pump`) orchestrates concurrency; this
// handler owns the workflow for exactly one document. Extracted so the
// orchestration (queue, backpressure, recovery) can evolve independently
// of the domain steps (resolve provider → download → parse → chunk →
// embed → persist).
//
// WHY a factory: `index.ts` builds one shared `DocumentService` and binds
// it here once at boot, so every job reuses the same repositories,
// storage driver, and provider resolution without module-level singletons.

import type { DocumentService } from "../Services/document.services";
import type { DocumentJob } from "./job.types";

export interface ProcessDocumentHandlerOptions {
  providerName?: unknown;
  providerKey?: unknown;
}

/**
 * Bind a `DocumentService` to the job-queue handler signature.
 * Failures are recorded as FAILED rows inside `processDocument`; this
 * wrapper never swallows — the queue's backstop `.catch()` only guards
 * against unexpected rejections escaping the service.
 */
export function createProcessDocumentHandler(
  documentService: Pick<
    DocumentService,
    "processDocument"
  >,
): (job: DocumentJob) => Promise<unknown> {
  return (job: DocumentJob) =>
    documentService.processDocument(job.projectId, job.documentId, {
      providerName: job.providerName,
      providerKey: job.providerKey,
    });
}
