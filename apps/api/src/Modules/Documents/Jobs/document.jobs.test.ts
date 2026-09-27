import { describe, expect, it } from "bun:test";

import {
  enqueueDocumentJob,
  initDocumentJobs,
  pendingJobCount,
  recoverPendingDocuments,
} from "./document.jobs";
import type { DocumentJob } from "./document.jobs";

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 25));
}

describe("document jobs", () => {
  it("runs enqueued jobs through the handler", async () => {
    const seen: DocumentJob[] = [];
    initDocumentJobs(async (job) => {
      seen.push(job);
    });

    enqueueDocumentJob({ documentId: "d1", projectId: "p1" });
    await flush();

    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ documentId: "d1", projectId: "p1" });
  });

  it("isolates failures: one bad job never blocks the rest", async () => {
    const processed: string[] = [];
    initDocumentJobs(async (job) => {
      if (job.documentId === "bad") throw new Error("boom");
      processed.push(job.documentId);
    });

    enqueueDocumentJob({ documentId: "bad", projectId: "p1" });
    enqueueDocumentJob({ documentId: "good-1", projectId: "p1" });
    enqueueDocumentJob({ documentId: "good-2", projectId: "p1" });
    await flush();

    expect(processed).toEqual(["good-1", "good-2"]);
    expect(pendingJobCount()).toBe(0);
  });

  it("recovers stuck documents on boot", async () => {
    const fakeRepo = {
      listStuckDocuments: async () => [
        { id: "stuck-1", projectId: "p1" },
        { id: "stuck-2", projectId: "p2" },
      ],
    };
    const seen: string[] = [];
    initDocumentJobs(async (job) => {
      seen.push(job.documentId);
    });

    const count = await recoverPendingDocuments(fakeRepo as never);
    await flush();

    expect(count).toBe(2);
    expect(seen).toEqual(["stuck-1", "stuck-2"]);
  });
});
