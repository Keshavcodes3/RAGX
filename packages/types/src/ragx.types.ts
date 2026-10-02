/**
 * Shared RAGX SDK/server contract.
 *
 * The developer configures exactly one provider with its key plus the
 * RAGX project key. Everything else (chunking, models, retrieval) is
 * decided internally by RAGX and never exposed.
 */

export type RAGXProviderName = "openai" | "mistral" | "gemini";

export const RAGX_PROVIDER_NAMES: readonly RAGXProviderName[] = [
  "openai",
  "mistral",
  "gemini",
] as const;

export interface RAGXConfig {
  provider: RAGXProviderName;
  providerApiKey: string;
  /**
   * Canonical RAGX project key (`ragx_live_...`). Authenticates the
   * developer/project with RAGX. Sent as `Authorization: Bearer`.
   * Conceptually separate from `providerApiKey` (sent via `X-Provider-Key`
   * so RAGX can call the selected embedding/LLM provider).
   */
  apiKey?: string;
  /**
   * @deprecated Use `apiKey` instead. Accepted as an alias: when both are
   * supplied they must match.
   */
  ragxApiKey?: string;
  baseUrl?: string;
}

/** Provider defaults RAGX uses internally. Not client configuration. */
export const RAGX_EMBEDDING_MODELS: Record<RAGXProviderName, string> = {
  openai: "text-embedding-3-small",
  mistral: "mistral-embed",
  gemini: "text-embedding-004",
};

export const RAGX_CHAT_MODELS: Record<RAGXProviderName, string> = {
  openai: "gpt-4o-mini",
  mistral: "mistral-small-latest",
  gemini: "gemini-2.0-flash",
};

export type DocumentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Document {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  chunks: number;
  createdAt: string;
}

/** Per-document outcome inside a batch upload. Independent lifecycle. */
export interface BatchDocumentSummary {
  id: string | null;
  filename: string;
  status: DocumentStatus;
  error?: string;
}

export interface BatchUploadResult {
  documents: BatchDocumentSummary[];
}

export interface SearchResult {
  text: string;
  score: number;
  documentId: string;
  page?: number;
}

export interface AskResult {
  answer: string;
  results: SearchResult[];
}

export function isRAGXProviderName(
  value: unknown,
): value is RAGXProviderName {
  return (
    typeof value === "string" &&
    (RAGX_PROVIDER_NAMES as readonly string[]).includes(value)
  );
}
