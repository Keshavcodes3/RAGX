import { describe, expect, it } from "bun:test";

import { RAGX } from "./index";

describe("RAGX SDK", () => {
  it("constructs with only the RAGX API key (no provider keys required)", () => {
    const ragx = new RAGX({ apiKey: "ragx_test" });
    expect(ragx).toBeInstanceOf(RAGX);
  });

  it("rejects a missing API key", () => {
    expect(() => new RAGX({ apiKey: "" })).toThrow(/apiKey/);
  });

  it("sends Authorization: Bearer with the RAGX key on search", async () => {
    const seen: { url: string; init: RequestInit }[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      seen.push({ url, init });
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }) as typeof fetch;

    try {
      const ragx = new RAGX({ apiKey: "ragx_test_key" });
      await ragx.search("hello");
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(seen).toHaveLength(1);
    const headers = seen[0]!.init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer ragx_test_key");
    expect(JSON.stringify(seen[0]!.init.body)).not.toContain("openai");
  });
});
