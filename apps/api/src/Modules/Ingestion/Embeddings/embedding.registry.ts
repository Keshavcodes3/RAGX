import { RAGX_EMBEDDING_MODELS } from "@repo/types";
import type { RAGXProviderName } from "@repo/types";

import { getRAGXProvider } from "../../Providers/Runtime/registry";
import { RuntimeEmbeddingProvider } from "./embedding.provider";
import type { EmbeddingProvider } from "./embedding.types";

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
