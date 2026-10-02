// NOTE: backwards-compatible vector-store barrel.
//
// Canonical types live in `vector-store.types.ts`, driver selection in
// `vector-store.registry.ts`. This module re-exports both so existing
// imports (`./vector.store`) keep working while new code imports from the
// hyphenated modules directly.

import { ProviderService } from "@/Modules/Providers/Services/provider.services";

import type { VectorStoreConfigInput } from "@repo/types";

export type {
  VectorPoint,
  VectorSearchHit,
  VectorStoreClient,
  VectorStoreResolution,
} from "./vector-store.types";
export { cosineSimilarity } from "./similarity";
export { PostgresJsonbVectorStore } from "./postgres-jsonb.vector-store";
export {
  createVectorStore,
  listVectorStores,
  registerVectorStore,
  resolveVectorStoreConfig as resolveVectorStoreConfigFromRegistry,
} from "./vector-store.registry";

/**
 * Decrypted vector-store credentials for internal pipeline use only.
 * Resolved after the RAGX API key identifies the project. Never leaves
 * the server, never logged, never returned by any controller.
 */
export type VectorStoreResolutionLegacy = VectorStoreConfigInput;

export async function resolveVectorStoreConfig(
  projectId: string,
  providerService = new ProviderService(),
): Promise<VectorStoreConfigInput> {
  return providerService.resolveVectorStoreCredentials(projectId);
}
