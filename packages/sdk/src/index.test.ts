import { describe, expect, it } from "bun:test";

import * as sdk from "./index.js";
import { RAGX } from "./index.js";
import type { RAGXConfig } from "./index.js";

const CONFIG = {
  provider: "openai" as const,
  providerApiKey: "sk-test-provider-key",
  ragxApiKey: "ragx_test_key",
};

function stubFetch(
  handler: (url: string, init: RequestInit) => Response | Promise<Response>,
) {
  const seen: { url: string; init: RequestInit }[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: unknown, init: unknown) => {
    seen.push({ url: url as string, init: (init ?? {}) as RequestInit });
    return handler(url as string, (init ?? {}) as RequestInit);
  }) as typeof fetch;
  return {
    seen,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function headersOf(init: RequestInit): Record<string, string> {
  return init.headers as Record<string, string>;
}

describe("RAGX SDK", () => {
  it("constructs with provider + providerApiKey + ragxApiKey", () => {
    expect(new RAGX(CONFIG)).toBeInstanceOf(RAGX);
  });

  it("rejects invalid initialization with clear errors", () => {
    expect(
      () =>
        new RAGX({
          provider: "cohere",
          providerApiKey: "x",
          ragxApiKey: "y",
        } as unknown as RAGXConfig),
    ).toThrowError(/provider must be one of openai, mistral, gemini/);

    expect(
      () => new RAGX({ ...CONFIG, providerApiKey: "  " }),
    ).toThrowError(/providerApiKey is required when provider="openai"/);

    expect(() => new RAGX({ ...CONFIG, ragxApiKey: "" })).toThrowError(
      /ragxApiKey is required/,
    );
  });

  it("sends ragx key as Bearer and provider key via provider headers", async () => {
    const stub = stubFetch(() => json({ data: { results: [] } }));

    try {
      await new RAGX(CONFIG).search("hello");
    } finally {
      stub.restore();
    }

    expect(stub.seen).toHaveLength(1);
    const headers = headersOf(stub.seen[0]!.init);
    expect(headers["Authorization"]).toBe("Bearer ragx_test_key");
    expect(headers["X-Provider"]).toBe("openai");
    expect(headers["X-Provider-Key"]).toBe("sk-test-provider-key");
  });

  it("uploads documents without strategy options", async () => {
    const stub = stubFetch((url, init) => {
      expect(url.endsWith("/v1/documents")).toBe(true);
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body["name"]).toBe("manual.pdf");
      expect(typeof body["contentBase64"]).toBe("string");
      expect("chunkingStrategy" in body).toBe(false);
      expect("embeddingStrategy" in body).toBe(false);
      return json({
        data: {
          id: "d1",
          filename: "manual.pdf",
          mimeType: "application/pdf",
          size: 18,
          status: "PENDING",
          chunks: 0,
          createdAt: new Date().toISOString(),
        },
      });
    });

    try {
      const ragx = new RAGX(CONFIG);
      const doc = await ragx.documents.upload(
        new TextEncoder().encode("%PDF-1.4 hello"),
        { name: "manual.pdf" },
      );
      expect(doc.id).toBe("d1");
      expect(doc.filename).toBe("manual.pdf");
      expect(doc.status).toBe("PENDING");
    } finally {
      stub.restore();
    }
  });

  it("uploads batches in one call and accepts Blob input", async () => {
    const stub = stubFetch((url, init) => {
      expect(url.endsWith("/v1/documents/batch")).toBe(true);
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string) as {
        files: { filename: string; mimeType?: string; contentBase64: string }[];
      };
      expect(body.files).toHaveLength(2);
      expect(body.files[0]).toMatchObject({ filename: "manual.pdf" });
      expect(typeof body.files[0]!.contentBase64).toBe("string");
      expect(body.files[1]).toMatchObject({
        filename: "faq.pdf",
        mimeType: "application/pdf",
      });
      return json({
        data: {
          documents: [
            { id: "d1", filename: "manual.pdf", status: "PENDING" },
            { id: "d2", filename: "faq.pdf", status: "PENDING" },
          ],
        },
      });
    });

    try {
      const ragx = new RAGX(CONFIG);
      const blob = new Blob(["%PDF-1.4 faq"], { type: "application/pdf" });
      const result = await ragx.documents.upload([
        {
          data: new TextEncoder().encode("%PDF-1.4 hello"),
          name: "manual.pdf",
        },
        { data: blob, name: "faq.pdf" },
      ]);
      expect(result.documents).toHaveLength(2);
      expect(result.documents[0]).toMatchObject({
        id: "d1",
        status: "PENDING",
      });
      expect(result.documents[1]!.id).toBe("d2");
    } finally {
      stub.restore();
    }
  });

  it("lists and deletes documents", async () => {
    const stub = stubFetch((url, init) => {
      if (url.endsWith("/v1/documents") && init.method !== "DELETE") {
        return json({ data: [] });
      }
      expect(url.endsWith("/v1/documents/d1")).toBe(true);
      expect(init.method).toBe("DELETE");
      return json({ data: null });
    });

    try {
      const ragx = new RAGX(CONFIG);
      expect(await ragx.documents.list()).toEqual([]);
      await ragx.documents.delete("d1");
    } finally {
      stub.restore();
    }
  });

  it("searches, retrieves, and asks through the server", async () => {
    const stub = stubFetch((url, init) => {
      expect(init.method).toBe("POST");
      if (url.endsWith("/v1/search")) {
        return json({
          data: {
            results: [{ text: "ctx", score: 0.9, documentId: "d1", page: 2 }],
          },
        });
      }
      expect(url.endsWith("/v1/ask")).toBe(true);
      return json({
        data: { answer: "answer", results: [] },
      });
    });

    try {
      const ragx = new RAGX(CONFIG);
      const hits = await ragx.search("q", { topK: 3 });
      expect(hits[0]!.page).toBe(2);
      expect(await ragx.retrieve("q")).toEqual(hits);
      const asked = await ragx.ask("q");
      expect(asked.answer).toBe("answer");
    } finally {
      stub.restore();
    }
  });

  it("surfaces server errors without internals", async () => {
    const stub = stubFetch(() =>
      json({ message: "Invalid or revoked API key" }, 401),
    );

    try {
      await expect(new RAGX(CONFIG).search("q")).rejects.toThrowError(
        /RAGX search failed \(401\): Invalid or revoked API key/,
      );
    } finally {
      stub.restore();
    }
  });

  it("no longer exposes strategy or client-side provider configuration", () => {
    expect("completeWithOwnKey" in sdk).toBe(false);
    const ragx = new RAGX(CONFIG) as unknown as Record<string, unknown>;
    expect("llm" in ragx).toBe(false);
    expect("apiKey" in ragx).toBe(false);
  });
});
