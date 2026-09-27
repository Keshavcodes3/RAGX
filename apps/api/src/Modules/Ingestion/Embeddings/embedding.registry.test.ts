import { describe, expect, it } from "bun:test";

import { createEmbeddingProvider } from "./embedding.registry";

const KEY = "sk-test-key";

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

function authOf(init: RequestInit): string {
  return (init.headers as Record<string, string>)["Authorization"] ?? "";
}

describe("embedding registry", () => {
  it("builds an openai provider with the default model and bound key", async () => {
    const stub = stubFetch(() =>
      json({ data: [{ embedding: [0.1, 0.2] }] }),
    );

    try {
      const embedding = createEmbeddingProvider("openai", KEY);
      expect(await embedding.embed(["hello"])).toEqual([[0.1, 0.2]]);
    } finally {
      stub.restore();
    }

    expect(stub.seen).toHaveLength(1);
    expect(stub.seen[0]!.url).toBe("https://api.openai.com/v1/embeddings");
    expect(authOf(stub.seen[0]!.init)).toBe(`Bearer ${KEY}`);
    const body = JSON.parse(stub.seen[0]!.init.body as string) as Record<
      string,
      unknown
    >;
    expect(body["model"]).toBe("text-embedding-3-small");
    expect(body["input"]).toEqual(["hello"]);
  });

  it("supports mistral and gemini with their own defaults", async () => {
    const stub = stubFetch((url) => {
      if (url.includes("mistral")) {
        return json({ data: [{ embedding: [1] }] });
      }
      return json({ embeddings: [{ values: [2] }] });
    });

    try {
      expect(await createEmbeddingProvider("mistral", KEY).embed(["a"])).toEqual([
        [1],
      ]);
      expect(await createEmbeddingProvider("gemini", KEY).embed(["a"])).toEqual([
        [2],
      ]);
    } finally {
      stub.restore();
    }

    const bodies = stub.seen.map(
      (s) => JSON.parse(s.init.body as string) as Record<string, unknown>,
    );
    expect(bodies[0]!["model"]).toBe("mistral-embed");
    expect(stub.seen[1]!.url).toContain("text-embedding-004:batchEmbedContents");
  });

  it("honors an explicit model override", async () => {
    const stub = stubFetch(() =>
      json({ data: [{ embedding: [0] }] }),
    );

    try {
      await createEmbeddingProvider("openai", KEY, "text-embedding-3-large").embed([
        "a",
      ]);
    } finally {
      stub.restore();
    }

    const body = JSON.parse(stub.seen[0]!.init.body as string) as Record<
      string,
      unknown
    >;
    expect(body["model"]).toBe("text-embedding-3-large");
  });

  it("rejects unsupported providers and missing keys", () => {
    expect(() =>
      createEmbeddingProvider("cohere" as never, KEY),
    ).toThrowError(/Unsupported embedding provider/);
    expect(() => createEmbeddingProvider("openai", "")).toThrowError(
      /providerApiKey is required/,
    );
    expect(() => createEmbeddingProvider("openai", "  ")).toThrowError(
      /providerApiKey is required/,
    );
  });

  it("short-circuits empty input without network traffic", async () => {
    const stub = stubFetch(() => json({}));
    try {
      expect(await createEmbeddingProvider("openai", KEY).embed([])).toEqual([]);
    } finally {
      stub.restore();
    }
    expect(stub.seen).toHaveLength(0);
  });

  it("instances are stateless and independent", async () => {
    const stub = stubFetch(() =>
      json({ data: [{ embedding: [0] }] }),
    );

    try {
      const first = createEmbeddingProvider("openai", "sk-first");
      const second = createEmbeddingProvider("openai", "sk-second");
      await first.embed(["a"]);
      await second.embed(["b"]);
    } finally {
      stub.restore();
    }

    expect(authOf(stub.seen[0]!.init)).toBe("Bearer sk-first");
    expect(authOf(stub.seen[1]!.init)).toBe("Bearer sk-second");
  });
});
