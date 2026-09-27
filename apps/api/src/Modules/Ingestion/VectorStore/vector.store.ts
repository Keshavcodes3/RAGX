import { ProviderService } from "@/Modules/Providers/Services/provider.services";

import type { VectorStoreConfigInput } from "@repo/types";

/**
 * Decrypted vector-store credentials for internal pipeline use only.
 * Resolved after the RAGX API key identifies the project. Never leaves
 * the server, never logged, never returned by any controller.
 */
export type VectorStoreResolution = VectorStoreConfigInput;

export interface VectorPoint {
  id: string;
  vector: number[];
  text: string;
  documentId: string;
  page?: number;
}

export interface VectorSearchHit {
  id: string;
  score: number;
  text: string;
  documentId: string;
  page?: number;
}

/**
 * Runtime vector-store client interface. Concrete implementations
 * (pgvector, Pinecone, Qdrant adapters) plug in here later; none are faked.
 */
export interface VectorStoreClient {
  readonly provider: string;
  upsert(points: VectorPoint[]): Promise<void>;
  search(vector: number[], topK: number): Promise<VectorSearchHit[]>;
}

export async function resolveVectorStoreConfig(
  projectId: string,
  providerService = new ProviderService(),
): Promise<VectorStoreResolution> {
  return providerService.resolveVectorStoreCredentials(projectId);
}
