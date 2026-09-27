import { DocumentRepository } from "../Repository/document.repo";

/**
 * In-process background job queue (no Redis). Each document gets its
 * own independent job: one failure never blocks or fails the others.
 *
 * The queue carries only identifiers (+ transient provider headers for
 * SDK uploads). Provider keys are never persisted — boot recovery
 * reprocesses via the project's stored embedding configuration, and
 * documents without one fail with a clear message.
 */

export interface DocumentJob {
  documentId: string;
  projectId: string;
  providerName?: unknown;
  providerKey?: unknown;
}

export type DocumentJobHandler = (job: DocumentJob) => Promise<unknown>;

const CONCURRENCY = 2;

const queue: DocumentJob[] = [];
let active = 0;
let handler: DocumentJobHandler | null = null;

async function pump(): Promise<void> {
  while (handler && active < CONCURRENCY && queue.length > 0) {
    const job = queue.shift()!;
    active++;
    handler(job)
      .catch(() => {
        // Handlers own per-document failure handling (FAILED status).
        // This is only a backstop against unhandled rejections.
      })
      .finally(() => {
        active--;
        void pump();
      });
  }
}

export function initDocumentJobs(jobHandler: DocumentJobHandler): void {
  handler = jobHandler;
  void pump();
}

export function enqueueDocumentJob(job: DocumentJob): void {
  queue.push(job);
  void pump();
}

/** Test hook: queue depth without touching internals. */
export function pendingJobCount(): number {
  return queue.length;
}

/**
 * Boot recovery: requeue anything left PENDING or PROCESSING by a
 * previous shutdown. No provider credentials survive a restart, so
 * recovered jobs rely on the stored project embedding configuration.
 */
export async function recoverPendingDocuments(
  repository: Pick<DocumentRepository, "listStuckDocuments"> = new DocumentRepository(),
): Promise<number> {
  const stuck = await repository.listStuckDocuments();
  for (const doc of stuck) {
    enqueueDocumentJob({ documentId: doc.id, projectId: doc.projectId });
  }
  return stuck.length;
}
