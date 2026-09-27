import { RAGX_EMBEDDING_MODELS } from "@repo/types";
import type { RAGXProviderName } from "@repo/types";

import { getRAGXProvider } from "../../Providers/Runtime/registry";
import { RuntimeEmbeddingProvider } from "./embedding.provider";
import type { EmbeddingProvider } from "./embedding.types";
import { DEFAULT_EMBED_BATCH_SIZE } from "./embedding.types";

/**
 * Single source of embedding configuration. RAGX resolves
 * provider + key + model once per request, then builds exactly one
 * of these. Ingestion and retrieval share it — no second config.
 *
 * No providers/ subfolder: the HTTP implementations already live in
 * Providers/Runtime and are reused here, not duplicated.
 */
export function createEmbeddingProvider(
  provider: RAGXProviderName,
  apiKey: string,
  model?: string,
): EmbeddingProvider {
  if (!apiKey?.trim()) {
    throw new Error("providerApiKey is required");
  }

  switch (provider) {
    case "openai":
    case "mistral":
    case "gemini": {
      const runtime = getRAGXProvider(provider);
      return new RuntimeEmbeddingProvider(
        runtime,
        apiKey,
        model ?? RAGX_EMBEDDING_MODELS[provider],
      );
    }
    default:
      throw new Error(
        `Unsupported embedding provider: ${provider as string}`,
      );
  }
}

/**
 * Shared batching loop for multi-chunk embedding (ingestion path).
 *
 * NOTE: providers cap request payloads and rate-limit per request, so
 * large chunk lists are sliced into `batchSize` windows. The count check
 * guards against providers that silently drop inputs.
 *
 * WHY centralize here instead of in DocumentService: retrieval embeds one
 * query (no batching) while ingestion embeds N chunks — both must use the
 * same provider instance semantics, and this keeps the windowing policy in
 * exactly one place.
 */
export async function embedTextsBatched(
  provider: EmbeddingProvider,
  texts: string[],
  batchSize: number = DEFAULT_EMBED_BATCH_SIZE,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const result = await provider.embed(batch);
    if (result.length !== batch.length) {
      throw new Error("Embedding count does not match chunk count");
    }
    vectors.push(...result);
  }
  return vectors;
}
