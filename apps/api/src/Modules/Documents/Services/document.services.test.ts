import { describe, expect, it } from "bun:test";

import { buildTestPdf } from "../../Ingestion/Parsers/pdf.test.utils";
import { resolveRequestProvider } from "../../Providers/Runtime/resolution";
import type { ObjectStorage } from "../../Storage/objectStorage";
import { DocumentService } from "./document.services";
import { RetrievalService } from "./retrieval.services";
import type { DocumentJob } from "../Jobs/document.jobs";

const PROJECT = "project-1";
const OTHER_PROJECT = "project-2";
const HEADERS = { providerName: "openai", providerKey: "sk-header-key" };

function stubFetch(
  handler: (url: string, init: RequestInit) => Response | Promise<Response>,
) {
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: unknown, init: unknown) => {
    return handler(url as string, (init ?? {}) as RequestInit);
  }) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

/**
 * Emulates the OpenAI HTTP API. Single-text queries get a fixed vector
 * so ranking is deterministic; batches get length-matched vectors.
 */
function stubOpenAI() {
  const seen: { url: string; init: RequestInit }[] = [];
  return {
    seen,
    restore: stubFetch((url, init) => {
      seen.push({ url, init });
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      if (url.includes("/embeddings")) {
        const input = body["input"] as unknown[];
        if (input.length === 1) {
          return json({ data: [{ embedding: [0.9, 0.1, 0] }] });
        }
        return json({
          data: input.map((_, i) => ({ embedding: [i % 7, i % 5, 1] })),
        });
      }
      return json({ choices: [{ message: { content: "generated answer" } }] });
    }),
  };
}

interface FakeDoc {
  id: string;
  projectId: string;
  filename: string;
  mimeType: string;
  size: number;
  objectKey: string;
  status: string;
  chunkCount: number;
  error?: string;
  createdAt: Date;
}

function documentRepo() {
  const docs: Record<string, FakeDoc> = {};
  const chunks: {
    documentId: string;
    projectId: string;
    page?: number;
    text: string;
    embedding: number[];
    metadata?: Record<string, unknown>;
  }[] = [];
  let seq = 0;

  return {
    chunks,
    docs,
    createDocument: async (data: {
      id?: string;
      projectId: string;
      filename: string;
      mimeType: string;
      size: number;
      objectKey: string;
    }) => {
      const id = data.id ?? `doc-${++seq}`;
      docs[id] = {
        id,
        projectId: data.projectId,
        filename: data.filename,
        mimeType: data.mimeType,
        size: data.size,
        objectKey: data.objectKey,
        status: "PENDING",
        chunkCount: 0,
        createdAt: new Date(),
      };
      return { ...docs[id]! };
    },
    findById: async (id: string) => docs[id],
    markProcessing: async (id: string) => {
      docs[id]!.status = "PROCESSING";
      return { id };
    },
    markCompleted: async (id: string, chunkCount: number) => {
      docs[id]!.status = "COMPLETED";
      docs[id]!.chunkCount = chunkCount;
      return { id };
    },
    markFailed: async (id: string, error: string) => {
      docs[id]!.status = "FAILED";
      (docs[id] as FakeDoc).error = error;
      return { id };
    },
    listStuckDocuments: async () =>
      Object.values(docs)
        .filter((d) => d.status === "PENDING" || d.status === "PROCESSING")
        .map((d) => ({ id: d.id, projectId: d.projectId })),
    listByProject: async (projectId: string) =>
      Object.values(docs).filter((d) => d.projectId === projectId),
    findByIdAndProject: async (id: string, projectId: string) => {
      const doc = docs[id];
      return doc && doc.projectId === projectId ? doc : undefined;
    },
    deleteByIdAndProject: async (id: string, projectId: string) => {
      const doc = docs[id];
      if (!doc || doc.projectId !== projectId) return undefined;
      delete docs[id];
      return { id };
    },
    insertChunks: async (
      rows: {
        documentId: string;
        projectId: string;
        page?: number;
        text: string;
        embedding: number[];
        metadata?: Record<string, unknown>;
      }[],
    ) => {
      chunks.push(...rows);
    },
    deleteChunksByDocument: async (documentId: string) => {
      for (let i = chunks.length - 1; i >= 0; i--) {
        if (chunks[i]!.documentId === documentId) chunks.splice(i, 1);
      }
    },
    listChunksByProject: async (projectId: string) =>
      chunks.filter((c) => c.projectId === projectId),
  };
}

function memoryStorage() {
  const objects = new Map<string, Buffer>();
  const storage: ObjectStorage = {
    upload: async (key, data) => {
      objects.set(key, Buffer.from(data));
    },
    download: async (key) => {
      const data = objects.get(key);
      if (!data) throw new Error(`Object not found: ${key}`);
      return data;
    },
    delete: async (key) => {
      objects.delete(key);
    },
    exists: async (key) => objects.has(key),
  };
  return { storage, objects };
}

function jobSpy() {
  const jobs: DocumentJob[] = [];
  return {
    jobs,
    enqueue: (job: DocumentJob) => {
      jobs.push(job);
    },
  };
}

function testService() {
  const repo = documentRepo();
  const { storage, objects } = memoryStorage();
  const { jobs, enqueue } = jobSpy();
  const service = new DocumentService(
    repo as never,
    undefined,
    storage,
    enqueue,
  );
  return { service, repo, storage, objects, jobs };
}

function pdfBase64(): string {
  return buildTestPdf([
    ["Getting Started", "JWT tokens are useful for authentication."],
    ["Second page body with enough words to chunk properly here."],
  ]).toString("base64");
}

describe("provider resolution", () => {
  it("resolves from SDK headers without touching stored config", async () => {
    const stub = stubOpenAI();
    let storedCalled = false;
    const fakeService = {
      resolveEmbeddingCredentials: async () => {
        storedCalled = true;
        throw new Error("must not be called");
      },
    };

    try {
      const resolved = await resolveRequestProvider(
        PROJECT,
        HEADERS,
        fakeService as never,
      );

      expect(resolved.provider).toBe("openai");
      expect(resolved.apiKey).toBe("sk-header-key");
      expect(resolved.embeddingModel).toBe("text-embedding-3-small");
      expect(resolved.runtime.name).toBe("openai");
      expect(storedCalled).toBe(false);

      // The resolved runtime performs real HTTP with the transient key.
      const vectors = await resolved.runtime.embed(["hello"], resolved.apiKey);
      expect(vectors).toEqual([[0.9, 0.1, 0]]);
      const auth = (stub.seen[0]!.init.headers ?? {}) as Record<string, string>;
      expect(auth["Authorization"]).toBe("Bearer sk-header-key");
    } finally {
      stub.restore();
    }
  });

  it("falls back to the stored project configuration", async () => {
    const stub = stubOpenAI();
    const fakeService = {
      resolveEmbeddingCredentials: async () => ({
        provider: "openai",
        model: "text-embedding-3-small",
        apiKey: "sk-stored-key",
      }),
    };

    try {
      const resolved = await resolveRequestProvider(
        PROJECT,
        {},
        fakeService as never,
      );
      expect(resolved.apiKey).toBe("sk-stored-key");
      expect(resolved.embeddingModel).toBe("text-embedding-3-small");
    } finally {
      stub.restore();
    }
  });

  it("rejects incomplete or missing provider configuration clearly", async () => {
    const stub = stubOpenAI();
    try {
      await expect(
        resolveRequestProvider(PROJECT, { providerName: "openai" }),
      ).rejects.toMatchObject({ statusCode: 400 });

      await expect(
        resolveRequestProvider(PROJECT, {
          providerName: "cohere",
          providerKey: "x",
        }),
      ).rejects.toMatchObject({ statusCode: 400 });

      const missing = {
        resolveEmbeddingCredentials: async () => {
          const { NotFoundError } = await import("@/Utils/httpError");
          throw new NotFoundError("Embedding provider is not configured");
        },
      };
      await expect(
        resolveRequestProvider(PROJECT, {}, missing as never),
      ).rejects.toThrowError(/No provider configured/);
    } finally {
      stub.restore();
    }
  });
});

describe("upload intake", () => {
  it("stores the original and enqueues a job, returning PENDING", async () => {
    const { service, repo, objects, jobs } = testService();
    const content = pdfBase64();

    const doc = await service.upload(
      PROJECT,
      { name: "manual.pdf", contentBase64: content },
      HEADERS,
    );

    expect(doc.filename).toBe("manual.pdf");
    expect(doc.status).toBe("PENDING");
    expect(doc.chunks).toBe(0);
    expect(doc.size).toBe(Buffer.from(content, "base64").length);

    const expectedKey = `projects/${PROJECT}/documents/${doc.id}/original`;
    expect(objects.get(expectedKey)?.toString("base64")).toBe(content);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      documentId: doc.id,
      projectId: PROJECT,
      providerName: "openai",
      providerKey: "sk-header-key",
    });
    expect(repo.docs[doc.id]!.status).toBe("PENDING");
  });

  it("marks storage failures FAILED without enqueueing", async () => {
    const { service, repo, jobs } = testService();
    const failing = {
      upload: async () => {
        throw new Error("disk full");
      },
      download: async () => {
        throw new Error("unreachable");
      },
      delete: async () => undefined,
      exists: async () => false,
    };
    const failingService = new DocumentService(
      repo as never,
      undefined,
      failing,
      jobs.push.bind(jobs),
    );

    await expect(
      failingService.upload(
        PROJECT,
        { name: "manual.pdf", contentBase64: pdfBase64() },
        HEADERS,
      ),
    ).rejects.toThrowError(/disk full/);
    expect(jobs).toHaveLength(0);
    const listed = await failingService.list(PROJECT);
    expect(listed[0]!.status).toBe("FAILED");
  });

  it("rejects empty and oversized uploads", async () => {
    const { service } = testService();

    await expect(
      service.upload(PROJECT, { name: "e.pdf", contentBase64: "" }),
    ).rejects.toThrow();

    const big = Buffer.alloc(16 * 1024 * 1024, "a").toString("base64");
    await expect(
      service.upload(PROJECT, { name: "big.pdf", contentBase64: big }),
    ).rejects.toThrow(/15MB/);
  });

  it("processes a batch independently: one bad file cannot fail the rest", async () => {
    const { service, jobs } = testService();

    const result = await service.uploadBatch(
      PROJECT,
      [
        { filename: "manual.pdf", contentBase64: pdfBase64() },
        { filename: "empty.pdf", contentBase64: "" },
        { filename: "faq.pdf", contentBase64: pdfBase64() },
      ],
      HEADERS,
    );

    expect(result.documents).toHaveLength(3);
    expect(result.documents[0]).toMatchObject({
      filename: "manual.pdf",
      status: "PENDING",
    });
    expect(result.documents[0]!.id).toBeTruthy();
    expect(result.documents[1]).toMatchObject({
      id: null,
      filename: "empty.pdf",
      status: "FAILED",
    });
    expect(result.documents[1]!.error).toBeTruthy();
    expect(result.documents[2]).toMatchObject({
      filename: "faq.pdf",
      status: "PENDING",
    });
    expect(jobs).toHaveLength(2);
    const firstId = result.documents[0]!.id;
    const thirdId = result.documents[2]!.id;
    expect(firstId).toBeTruthy();
    expect(thirdId).toBeTruthy();
    expect(jobs[0]!.documentId).toBe(firstId!);
    expect(jobs[1]!.documentId).toBe(thirdId!);
  });
});

describe("background processing", () => {
  it("runs the full pipeline to COMPLETED with project-scoped chunks", async () => {
    const stub = stubOpenAI();
    const { service, repo } = testService();

    try {
      const doc = await service.upload(
        PROJECT,
        { name: "manual.pdf", contentBase64: pdfBase64() },
        HEADERS,
      );
      const summary = await service.processDocument(
        PROJECT,
        doc.id,
        HEADERS,
      );

      expect(summary).toMatchObject({
        id: doc.id,
        filename: "manual.pdf",
        status: "COMPLETED",
      });
      expect(repo.docs[doc.id]!.status).toBe("COMPLETED");
      expect(repo.chunks.length).toBeGreaterThan(0);
      expect(
        repo.chunks.every(
          (c) => c.projectId === PROJECT && c.documentId === doc.id,
        ),
      ).toBe(true);
      expect(repo.chunks.every((c) => c.embedding.length === 3)).toBe(true);
      expect(repo.chunks[0]).toMatchObject({
        page: 1,
        metadata: { page: 1, chunkIndex: 0 },
      });
    } finally {
      stub.restore();
    }
  });

  it("marks corrupt documents FAILED with a safe error", async () => {
    const stub = stubOpenAI();
    const { service, repo } = testService();

    try {
      const doc = await service.upload(
        PROJECT,
        {
          name: "broken.pdf",
          contentBase64: Buffer.from("not a pdf").toString("base64"),
        },
        HEADERS,
      );

      const seen = await service
        .processDocument(PROJECT, doc.id, HEADERS)
        .then(
          () => null,
          (err: unknown) => err,
        );

      expect(seen).toBeTruthy();
      expect(repo.docs[doc.id]!.status).toBe("FAILED");
      const listed = await service.list(PROJECT);
      expect(listed[0]!.status).toBe("FAILED");
      expect(JSON.stringify(listed)).not.toContain("sk-header-key");
    } finally {
      stub.restore();
    }
  });

  it("rejects cross-project processing and missing objects", async () => {
    const stub = stubOpenAI();
    const { service, repo, objects } = testService();

    try {
      const doc = await service.upload(
        PROJECT,
        { name: "manual.pdf", contentBase64: pdfBase64() },
        HEADERS,
      );

      await expect(
        service.processDocument(OTHER_PROJECT, doc.id, HEADERS),
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(repo.docs[doc.id]!.status).toBe("PENDING");

      objects.clear();
      await expect(
        service.processDocument(PROJECT, doc.id, HEADERS),
      ).rejects.toThrow();
      expect(repo.docs[doc.id]!.status).toBe("FAILED");
    } finally {
      stub.restore();
    }
  });

  it("skips already-COMPLETED documents without re-embedding", async () => {
    const stub = stubOpenAI();
    const { service } = testService();

    try {
      const doc = await service.upload(
        PROJECT,
        { name: "manual.pdf", contentBase64: pdfBase64() },
        HEADERS,
      );
      await service.processDocument(PROJECT, doc.id, HEADERS);
      const callsBefore = stub.seen.length;
      const summary = await service.processDocument(PROJECT, doc.id, HEADERS);
      expect(summary.status).toBe("COMPLETED");
      expect(stub.seen.length).toBe(callsBefore);
    } finally {
      stub.restore();
    }
  });
});

describe("documents access control", () => {
  it("lists, gets, and deletes within project scope only", async () => {
    const { service, objects } = testService();

    const doc = await service.upload(
      PROJECT,
      { name: "manual.pdf", contentBase64: pdfBase64() },
      HEADERS,
    );
    const key = `projects/${PROJECT}/documents/${doc.id}/original`;

    expect((await service.list(PROJECT)).length).toBe(1);
    expect((await service.list(OTHER_PROJECT)).length).toBe(0);
    expect((await service.get(doc.id, PROJECT)).filename).toBe("manual.pdf");
    await expect(service.get(doc.id, OTHER_PROJECT)).rejects.toMatchObject({
      statusCode: 404,
    });

    await expect(service.remove(doc.id, OTHER_PROJECT)).rejects.toMatchObject({
      statusCode: 404,
    });
    await service.remove(doc.id, PROJECT);
    expect((await service.list(PROJECT)).length).toBe(0);
    expect(objects.has(key)).toBe(false);
    await expect(service.remove(doc.id, PROJECT)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("tolerates a missing object on delete", async () => {
    const { service, objects } = testService();

    const doc = await service.upload(
      PROJECT,
      { name: "manual.pdf", contentBase64: pdfBase64() },
      HEADERS,
    );
    objects.clear();
    await service.remove(doc.id, PROJECT);
    expect((await service.list(PROJECT)).length).toBe(0);
  });
});

describe("retrieval engine", () => {
  // Allow-fake for the output guardrail: keeps retrieval/ask tests
  // deterministic without touching the Gemini-backed guard model.
  // Guardrail behavior itself is covered in "ask output guardrail" below.
  const allowGuardrail = async () => ({ decision: "allow" as const });

  function seeded() {
    const { repo } = testService();
    repo.chunks.push(
      { documentId: "d1", projectId: PROJECT, page: 1, text: "aaa", embedding: [1, 0, 0] },
      { documentId: "d1", projectId: PROJECT, page: 2, text: "bbb", embedding: [0, 1, 0] },
      { documentId: "d2", projectId: PROJECT, page: 1, text: "ccc", embedding: [0, 0, 1] },
    );
    return new RetrievalService(repo as never, undefined, allowGuardrail);
  }

  it("ranks chunks by cosine similarity and honors topK", async () => {
    const stub = stubOpenAI();
    try {
      const hits = await seeded().search(PROJECT, "query", 2, HEADERS);

      expect(hits.length).toBe(2);
      expect(hits[0]!.text).toBe("aaa");
      expect(hits[0]!.score).toBeGreaterThan(hits[1]!.score);
      expect(hits[0]).toMatchObject({ documentId: "d1", page: 1 });
    } finally {
      stub.restore();
    }
  });

  it("ask builds context and generates through the provider", async () => {
    const stub = stubOpenAI();
    try {
      const result = await seeded().ask(PROJECT, "What is this?", 5, HEADERS);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.answer).toBe("generated answer");
      const generateCall = stub.seen.find((c) =>
        c.url.includes("/chat/completions"),
      );
      expect(generateCall).toBeDefined();
      const body = JSON.parse(generateCall!.init.body as string) as {
        messages: { content: string }[];
      };
      expect(
        body.messages.some((m) => m.content.includes("What is this?")),
      ).toBe(true);
      expect(body.messages.some((m) => m.content.includes("aaa"))).toBe(true);
    } finally {
      stub.restore();
    }
  });

  it("ask answers deterministically when nothing matches", async () => {
    const stub = stubOpenAI();
    try {
      const { repo } = testService();
      const retrieval = new RetrievalService(
        repo as never,
        undefined,
        allowGuardrail,
      );
      const result = await retrieval.ask(PROJECT, "anything", 5, HEADERS);

      expect(result.results).toEqual([]);
      expect(result.answer).toContain("couldn't find");
      expect(
        stub.seen.some((c) => c.url.includes("/chat/completions")),
      ).toBe(false);
    } finally {
      stub.restore();
    }
  });

  it("never exposes provider keys in results", async () => {
    const stub = stubOpenAI();
    const secret = { providerName: "openai", providerKey: "sk-ultra-secret" };
    try {
      const service = seeded();
      const hits = await service.search(PROJECT, "q", 5, secret);
      const asked = await service.ask(PROJECT, "q", 5, secret);

      expect(JSON.stringify({ hits, asked })).not.toContain("sk-ultra-secret");
    } finally {
      stub.restore();
    }
  });

  it("scopes vector search to the authenticated project", async () => {
    const stub = stubOpenAI();
    try {
      const { repo } = testService();
      repo.chunks.push(
        { documentId: "mine", projectId: PROJECT, text: "aaa", embedding: [1, 0, 0] },
        { documentId: "theirs", projectId: OTHER_PROJECT, text: "aaa", embedding: [1, 0, 0] },
      );
      const service = new RetrievalService(
        repo as never,
        undefined,
        allowGuardrail,
      );

      const hits = await service.search(PROJECT, "query", 10, HEADERS);
      expect(hits.length).toBe(1);
      expect(hits[0]!.documentId).toBe("mine");

      const otherHits = await service.search(OTHER_PROJECT, "query", 10, HEADERS);
      expect(otherHits.length).toBe(1);
      expect(otherHits[0]!.documentId).toBe("theirs");
    } finally {
      stub.restore();
    }
  });
});

describe("ask output guardrail", () => {
  const allowGuardrail = async () => ({ decision: "allow" as const });
  const reviewGuardrail = async () => ({ decision: "review" as const });

  function singleChunk() {
    const { repo } = testService();
    repo.chunks.push(
      { documentId: "d1", projectId: PROJECT, page: 1, text: "aaa", embedding: [1, 0, 0] },
    );
    return repo;
  }

  it("returns the answer when the guardrail allows", async () => {
    const stub = stubOpenAI();
    try {
      const repo = singleChunk();
      const service = new RetrievalService(
        repo as never,
        undefined,
        allowGuardrail,
      );

      const result = await service.ask(PROJECT, "What is this?", 5, HEADERS);

      expect(result.answer).toBe("generated answer");
      expect(result.results.length).toBeGreaterThan(0);
    } finally {
      stub.restore();
    }
  });

  it("blocks credential leaks without returning the answer", async () => {
    const { envConfig } = await import("@/config/envConfig");
    envConfig.GEMINI_GUARD_API_KEY ||= "guardrail-test-key";

    const leaked = `the key is ragx_live_${"A".repeat(32)}`;
    const chatBodies: string[] = [];
    const restore = stubFetch((url, init) => {
      if (url.includes("/embeddings")) {
        return json({ data: [{ embedding: [1, 0, 0] }] });
      }
      chatBodies.push((init.body as string) ?? "");
      return json({ choices: [{ message: { content: leaked } }] });
    });

    try {
      const repo = singleChunk();
      // Default (real) guardrail: the local secret scanner must block the
      // leaked key without any network call to the guard model.
      const service = new RetrievalService(repo as never);

      const err = await service
        .ask(PROJECT, "What is this?", 5, HEADERS)
        .then(
          () => null,
          (error: unknown) => error,
        );

      // Generation happened first — the guard inspected actual output.
      expect(chatBodies.length).toBe(1);
      expect(err).toMatchObject({ statusCode: 403 });
      const message = err instanceof Error ? err.message : String(err);
      expect(message).not.toContain("A".repeat(32));
      expect(message).not.toContain(leaked);
    } finally {
      restore();
    }
  });

  it("withholds suspicious output marked for review", async () => {
    const stub = stubOpenAI();
    try {
      const repo = singleChunk();
      const service = new RetrievalService(
        repo as never,
        undefined,
        reviewGuardrail,
      );

      const err = await service
        .ask(PROJECT, "What is this?", 5, HEADERS)
        .then(
          () => null,
          (error: unknown) => error,
        );

      expect(err).toMatchObject({ statusCode: 502 });
      const message = err instanceof Error ? err.message : String(err);
      expect(message).not.toContain("generated answer");
    } finally {
      stub.restore();
    }
  });

  it("withholds the answer when the guardrail itself fails", async () => {
    const stub = stubOpenAI();
    try {
      const repo = singleChunk();
      const failing = async (): Promise<{
        decision: "allow" | "block" | "review";
      }> => {
        throw new Error("boom");
      };
      const service = new RetrievalService(
        repo as never,
        undefined,
        failing,
      );

      const err = await service
        .ask(PROJECT, "What is this?", 5, HEADERS)
        .then(
          () => null,
          (error: unknown) => error,
        );

      expect(err).toMatchObject({ statusCode: 502 });
      const message = err instanceof Error ? err.message : String(err);
      expect(message).not.toContain("boom");
      expect(message).not.toContain("generated answer");
    } finally {
      stub.restore();
    }
  });
});
