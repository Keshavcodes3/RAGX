// NOTE: vector-store registry (driver selection).
//
// The business layer never constructs a driver directly — it asks for a
// client by provider name. `postgres` is the current (and only) driver:
// vectors live in `document_chunk.embedding` (JSONB) and ranking happens
// in-JS via `cosineSimilarity`. External drivers (pgvector extension,
// Pinecone, Qdrant) register here later without touching services.
//
// TODO: add a pgvector driver using `<=>` ordering once the pgvector
// extension is provisioned, and keep the JSONB driver as fallback.

import { ProviderService } from "@/Modules/Providers/Services/provider.services";

import type {
  VectorStoreClient,
  VectorStoreResolution,
} from "./vector-store.types";

export type { VectorStoreClient, VectorStoreResolution } from "./vector-store.types";

type VectorStoreFactory = (
  resolution: VectorStoreResolution,
) => VectorStoreClient | Promise<VectorStoreClient>;

const factories = new Map<string, VectorStoreFactory>();

export function registerVectorStore(
  provider: string,
  factory: VectorStoreFactory,
): void {
  factories.set(provider.toLowerCase(), factory);
}

export async function createVectorStore(
  resolution: VectorStoreResolution & { provider: string },
): Promise<VectorStoreClient> {
  const factory = factories.get(resolution.provider.toLowerCase());
  if (!factory) {
    throw new Error(
      `Unsupported vector store provider: ${resolution.provider}`,
    );
  }
  return factory(resolution);
}

export function listVectorStores(): string[] {
  return [...factories.keys()];
}

/** Resolve stored (decrypted) vector-store credentials for a project. */
export async function resolveVectorStoreConfig(
  projectId: string,
  providerService = new ProviderService(),
): Promise<VectorStoreResolution> {
  return providerService.resolveVectorStoreCredentials(projectId);
}
