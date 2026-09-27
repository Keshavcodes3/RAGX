import { describe, expect, it } from "bun:test";

import {
  embeddingConfigSchema,
  vectorStoreConfigSchema,
} from "./provider.validation";

describe("provider validation", () => {
  it("accepts a valid embedding configuration", () => {
    const parsed = embeddingConfigSchema.safeParse({
      provider: "openai",
      model: "text-embedding-3-small",
      apiKey: "sk-test-key-12345678",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects embedding configs with missing provider, model, or key", () => {
    for (const body of [
      { model: "text-embedding-3-small", apiKey: "sk-test-key-12345678" },
      { provider: "openai", apiKey: "sk-test-key-12345678" },
      { provider: "openai", model: "text-embedding-3-small" },
      { provider: "cohere", model: "embed", apiKey: "sk-test-key-12345678" },
      { provider: "openai", model: "  ", apiKey: "sk-test-key-12345678" },
    ]) {
      expect(embeddingConfigSchema.safeParse(body).success).toBe(false);
    }
  });

  it("accepts per-provider vector store shapes", () => {
    expect(
      vectorStoreConfigSchema.safeParse({
        provider: "pinecone",
        apiKey: "pc-test-key-12345678",
        index: "my-rag-index",
      }).success,
    ).toBe(true);

    expect(
      vectorStoreConfigSchema.safeParse({
        provider: "qdrant",
        url: "https://xyz.cloud.qdrant.io",
        collection: "docs",
      }).success,
    ).toBe(true);

    expect(
      vectorStoreConfigSchema.safeParse({ provider: "pgvector" }).success,
    ).toBe(true);
  });

  it("rejects vector configs missing provider-specific fields", () => {
    expect(
      vectorStoreConfigSchema.safeParse({
        provider: "pinecone",
        apiKey: "pc-test-key-12345678",
      }).success,
    ).toBe(false);

    expect(
      vectorStoreConfigSchema.safeParse({
        provider: "qdrant",
        collection: "docs",
      }).success,
    ).toBe(false);

    expect(
      vectorStoreConfigSchema.safeParse({
        provider: "qdrant",
        url: "not-a-url",
        collection: "docs",
      }).success,
    ).toBe(false);
  });

  it("never echoes secrets in validation errors", () => {
    const secret = "sk-super-secret-should-never-appear-123";
    const parsed = vectorStoreConfigSchema.safeParse({
      provider: "qdrant",
      url: "not-a-url",
      collection: "docs",
      apiKey: secret,
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(JSON.stringify(parsed.error.flatten())).not.toContain(secret);
    }

    const badEmbedding = embeddingConfigSchema.safeParse({
      provider: "openai",
      model: "",
      apiKey: secret,
    });
    expect(badEmbedding.success).toBe(false);
    if (!badEmbedding.success) {
      expect(JSON.stringify(badEmbedding.error.flatten())).not.toContain(
        secret,
      );
    }
  });
});
