export type LlmProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "groq"
  | "openrouter";

/**
 * BYOK config. SDK-side only by default — the provider apiKey must
 * never be sent to the RAGX API. Server-side vault storage (encrypted)
 * is opt-in per project via the dashboard.
 */
export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface RagxClientConfig {
  apiKey: string;
  baseUrl?: string;
  llm?: LlmConfig;
}

export interface LlmServerConfigInput {
  provider: LlmProvider;
  model: string;
  apiKey: string;
}

export interface LlmServerConfigMeta {
  provider: LlmProvider;
  model: string;
  /** Redacted: e.g. "***...1234". Raw key is never returned. */
  keyPreview: string;
  updatedAt: Date;
}

export const SUPPORTED_LLM_MODELS: Record<LlmProvider, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o"],
  anthropic: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest"],
  gemini: ["gemini-2.0-flash", "gemini-1.5-flash"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  openrouter: [],
};

export function redactApiKey(apiKey: string): string {
  const tail = apiKey.slice(-4);
  return `***...${tail}`;
}
