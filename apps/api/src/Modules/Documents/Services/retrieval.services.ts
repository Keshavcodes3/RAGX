import { resolveRequestProvider } from "../../Providers/Runtime/resolution";
import { createEmbeddingProvider } from "../../Ingestion/Embeddings/embedding.registry";
import { ProviderService } from "../../Providers/Services/provider.services";
import { DocumentRepository } from "../Repository/document.repo";
import type { ProviderHeaders } from "./document.services";

import type { AskResult, SearchResult } from "@repo/types";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

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
    if (!queryVector) return [];

    const chunks =
      await this.documentRepository.listChunksByProject(projectId);

    return chunks
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
