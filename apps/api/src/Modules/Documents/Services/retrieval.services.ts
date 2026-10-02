import { resolveRequestProvider } from "../../Providers/Runtime/resolution";
import { createEmbeddingProvider } from "../../Ingestion/Embeddings/embedding.registry";
import { cosineSimilarity } from "../../Ingestion/VectorStore/similarity";
import { ProviderService } from "../../Providers/Services/provider.services";
import { DocumentRepository } from "../Repository/document.repo";
import type { ProviderHeaders } from "./document.services";

import type { AskResult, SearchResult } from "@repo/types";

// NOTE: cosine ranking lives in `Ingestion/VectorStore/similarity.ts` —
// shared with semantic chunking so both rank identically. Vectors are
// stored as JSONB today (`document_chunk.embedding`) and ranked in-JS;
// the VectorStore abstraction owns the migration to pgvector ordering.

export class RetrievalService {
  constructor(
    private readonly documentRepository = new DocumentRepository(),
    private readonly providerService = new ProviderService(),
  ) {}

  async search(
    projectId: string,
    query: string,
    topK: number,
    providerHeaders: ProviderHeaders = {},
  ): Promise<SearchResult[]> {
    const resolved = await resolveRequestProvider(
      projectId,
      providerHeaders,
      this.providerService,
    );

    // Same embedding configuration as ingestion: resolved once,
    // built through the registry. No second config anywhere.
    const embedding = createEmbeddingProvider(
      resolved.provider,
      resolved.apiKey,
      resolved.embeddingModel,
    );
    const [queryVector] = await embedding.embed([query]);
    if (!queryVector || queryVector.length === 0) return [];

    const chunks =
      await this.documentRepository.listChunksByProject(projectId);

    // Dimension consistency: ingestion validates a single dimension per
    // document batch, but the stored model can change over time. Chunks
    // whose embedding length differs from the query vector cannot be
    // ranked meaningfully (cosine uses min-length), so they are skipped
    // rather than scored. Non-finite stored values are skipped as well.
    const queryDim = queryVector.length;
    const rankable = chunks.filter(
      (chunk) =>
        Array.isArray(chunk.embedding) &&
        chunk.embedding.length === queryDim &&
        chunk.embedding.every((v) => Number.isFinite(v)),
    );

    return rankable
      .map((chunk) => ({
        score: cosineSimilarity(queryVector, chunk.embedding ?? []),
        text: chunk.text,
        documentId: chunk.documentId,
        page: chunk.page ?? undefined,
      }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  async ask(
    projectId: string,
    query: string,
    topK: number,
    providerHeaders: ProviderHeaders = {},
  ): Promise<AskResult> {
    const results = await this.search(projectId, query, topK, providerHeaders);

    if (results.length === 0) {
      return {
        answer:
          "I couldn't find relevant context in your documents to answer that.",
        results: [],
      };
    }

    const resolved = await resolveRequestProvider(
      projectId,
      providerHeaders,
      this.providerService,
    );

    const context = results
      .map(
        (hit, i) =>
          `[${i + 1}] (document ${hit.documentId}${hit.page !== undefined ? `, page ${hit.page}` : ""})\n${hit.text}`,
      )
      .join("\n\n");

    const answer = await resolved.runtime.generate(
      `Context:\n${context}\n\nQuestion: ${query}`,
      resolved.apiKey,
      {
        system:
          "Answer using only the provided context. Cite page numbers when present.",
      },
    );

    return { answer, results };
  }
}
