import type { RAGXProvider } from "../../Providers/Runtime/provider";
import type { EmbeddingProvider } from "./embedding.types";

/**
 * Stateless key-bound adapter over the existing provider runtimes.
 * Holds no global state: one instance per resolved configuration,
 * safe to construct per request.
 */
export class RuntimeEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly runtime: RAGXProvider,
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return Promise.resolve([]);
    return this.runtime.embed(texts, this.apiKey, { model: this.model });
  }
}
