import { describe, expect, it } from "bun:test";

import { GeminiProvider } from "./gemini.provider";
import { MistralProvider } from "./mistral.provider";
import { OpenAIProvider } from "./openai.provider";
import { ProviderUpstreamError } from "./provider";
import { getRAGXProvider } from "./registry";

const KEY = "test-provider-key";

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

describe("provider runtime", () => {
  it("openai embeds with bearer auth and parses vectors", async () => {
    const seen: { url: string; init: RequestInit }[] = [];
    const restore = stubFetch((url, init) => {
      seen.push({ url, init });
      return json({ data: [{ embedding: [0.1, 0.2] }, { embedding: [0.3, 0.4] }] });
    });

    try {
      const vectors = await new OpenAIProvider().embed(["a", "b"], KEY);
      expect(vectors).toEqual([
        [0.1, 0.2],
        [0.3, 0.4],
      ]);
    } finally {
      restore();
    }

    expect(seen).toHaveLength(1);
    expect(seen[0]!.url).toBe("https://api.openai.com/v1/embeddings");
    const headers = seen[0]!.init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe(`Bearer ${KEY}`);
    const body = JSON.parse(seen[0]!.init.body as string) as Record<string, unknown>;
    expect(body["model"]).toBe("text-embedding-3-small");
    expect(body["input"]).toEqual(["a", "b"]);
  });

  it("openai generates chat completions", async () => {
    const restore = stubFetch(() =>
      json({ choices: [{ message: { content: "  hello  " } }] }),
    );

    try {
      const text = await new OpenAIProvider().generate("hi", KEY, {
        system: "sys",
      });
      expect(text).toBe("hello");
    } finally {
      restore();
    }
  });

  it("mistral uses its own base URL", async () => {
    const seen: string[] = [];
    const restore = stubFetch((url) => {
      seen.push(url);
      return json({ data: [{ embedding: [1] }] });
    });

    try {
      await new MistralProvider().embed(["a"], KEY);
    } finally {
      restore();
    }

    expect(seen[0]).toBe("https://api.mistral.ai/v1/embeddings");
  });

  it("gemini embeds via batchEmbedContents and generates content", async () => {
    const seen: string[] = [];
    const restore = stubFetch((url) => {
      seen.push(url);
      if (url.includes(":batchEmbedContents")) {
        return json({ embeddings: [{ values: [0.5] }] });
      }
      return json({ candidates: [{ content: { parts: [{ text: "answer" }] } }] });
    });

    try {
      const gemini = new GeminiProvider();
      expect(await gemini.embed(["a"], KEY)).toEqual([[0.5]]);
      expect(await gemini.generate("q", KEY)).toBe("answer");
    } finally {
      restore();
    }

    expect(seen[0]).toContain("text-embedding-004:batchEmbedContents");
    expect(seen[1]).toContain("gemini-2.0-flash:generateContent");
  });

  it("maps upstream failures without leaking secrets", async () => {
    const restore = stubFetch(() => json({ error: "bad key sk-secret" }, 401));

    try {
      const error = await new OpenAIProvider()
        .embed(["a"], "sk-live-secret")
        .then(
          () => null,
          (err: unknown) => err,
        );
      expect(error).toBeInstanceOf(ProviderUpstreamError);
      expect(String(error)).not.toContain("sk-live-secret");
    } finally {
      restore();
    }
  });

  it("maps malformed responses and network failures", async () => {
    let restore = stubFetch(() => json({ data: [] }));
    try {
      await expect(new OpenAIProvider().embed(["a"], KEY)).rejects.toBeInstanceOf(
        ProviderUpstreamError,
      );
    } finally {
      restore();
    }

    restore = stubFetch(() => {
      throw new TypeError("fetch failed");
    });
    try {
      await expect(new MistralProvider().generate("q", KEY)).rejects.toBeInstanceOf(
        ProviderUpstreamError,
      );
    } finally {
      restore();
    }
  });

  it("registry resolves known providers and rejects unknown ones", () => {
    expect(getRAGXProvider("openai").name).toBe("openai");
    expect(getRAGXProvider("mistral").name).toBe("mistral");
    expect(getRAGXProvider("gemini").name).toBe("gemini");
    expect(() => getRAGXProvider("cohere")).toThrowError(/Unsupported provider/);
  });
});
