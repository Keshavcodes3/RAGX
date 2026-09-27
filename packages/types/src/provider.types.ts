export type EmbeddingProvider = "openai" | "mistral";

export type VectorStoreProvider = "pinecone" | "qdrant" | "pgvector";

export const SUPPORTED_EMBEDDING_MODELS: Record<EmbeddingProvider, string[]> = {
  openai: [
    "text-embedding-3-small",
    "text-embedding-3-large",
    "text-embedding-ada-002",
  ],
  mistral: ["mistral-embed"],
};

export interface EmbeddingConfigInput {
  provider: EmbeddingProvider;
  model: string;
  apiKey: string;
}

export interface EmbeddingConfigMeta {
  provider: EmbeddingProvider;
  model: string;
  configured: true;
  /** Non-reconstructible hint, e.g. "sk-••••••••abcd". Raw key never returned. */
  apiKeyPreview: string;
  updatedAt: Date;
}

export interface PineconeConfigInput {
  provider: "pinecone";
  apiKey: string;
  index: string;
}

export interface QdrantConfigInput {
  provider: "qdrant";
  url: string;
  collection: string;
  apiKey?: string;
}

export interface PgvectorConfigInput {
  provider: "pgvector";
  /** Optional override. When omitted the server uses its own DATABASE_URL. */
  connectionString?: string;
}

export type VectorStoreConfigInput =
  | PineconeConfigInput
  | QdrantConfigInput
  | PgvectorConfigInput;

export interface VectorStoreConfigMeta {
  provider: VectorStoreProvider;
  configured: true;
  /** Present only when the provider uses an API key. Never the raw secret. */
  apiKeyPreview?: string;
  /** Non-secret summary, e.g. { index: "..." } or { collection, url }. */
  details: Record<string, string>;
  updatedAt: Date;
}

/**
 * Build a display hint that cannot reconstruct the secret:
 * first 3 chars + mask + last 4 chars.
 */
export function toSecretPreview(secret: string, tail = 4): string {
  const head = secret.slice(0, 3);
  const last = secret.slice(-tail);
  return `${head}••••••••${last}`;
}

export function toKeyPreview(rawKey: string): string {
  const prefix = rawKey.startsWith("ragx_")
    ? rawKey.slice(0, 5)
    : rawKey.slice(0, 3);
  return `${prefix}••••••••${rawKey.slice(-4)}`;
}
