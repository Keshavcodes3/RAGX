import type { LlmConfig, RagxClientConfig } from "@repo/types";

export const DEFAULT_BASE_URL = "https://api.ragx.dev";

const OPENAI_COMPATIBLE_BASE_URL: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1",
};

function resolveLlmBaseUrl(llm: LlmConfig): string {
  if (llm.baseUrl) return llm.baseUrl.replace(/\/$/, "");
  const preset = OPENAI_COMPATIBLE_BASE_URL[llm.provider];
  if (!preset) {
    throw new Error(
      `Provider "${llm.provider}" has no default client-side endpoint yet. Pass llm.baseUrl explicitly.`,
    );
  }
  return preset;
}

function assertConfig(config: RagxClientConfig): void {
  if (!config.apiKey?.trim()) throw new Error("RAGX apiKey is required");
  const llm = config.llm;
  if (!llm) return;
  if (!llm.provider) throw new Error("llm.provider is required when llm is set");
  if (!llm.model?.trim()) throw new Error("llm.model is required when llm is set");
  if (!llm.apiKey?.trim()) throw new Error("llm.apiKey is required when llm is set");
}

export interface SearchOptions {
  knowledgeBase?: string;
  topK?: number;
}

export interface SearchHit {
  text: string;
  score: number;
  documentId: string;
  page?: number;
}

export class RAGX {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly llm?: LlmConfig;

  constructor(config: RagxClientConfig) {
    assertConfig(config);
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    // Kept in memory only. Never sent to the RAGX API.
    this.llm = config.llm;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async search(query: string, opts: SearchOptions = {}): Promise<SearchHit[]> {
    const res = await fetch(`${this.baseUrl}/v1/search`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        query,
        knowledgeBase: opts.knowledgeBase,
        topK: opts.topK ?? 5,
      }),
    });
    if (!res.ok) throw new Error(`RAGX search failed: ${res.status}`);
    const data = (await res.json()) as { results: SearchHit[] };
    return data.results;
  }

  /**
   * Retrieval + generation in one call. Retrieval runs against RAGX,
   * generation runs direct to the dev's LLM provider with THEIR key.
   * RAGX never sees llm.apiKey.
   */
  async ask(query: string, opts: SearchOptions = {}): Promise<string> {
    if (!this.llm) {
      throw new Error("llm config is required for ask(). Pass llm:{provider,model,apiKey}.");
    }
    const hits = await this.search(query, opts);
    const context = hits.map((h) => h.text).join("\n\n");
    return completeWithOwnKey(this.llm, [
      {
        role: "system",
        content: "Answer using only the provided context. Cite page numbers when present.",
      },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${query}` },
    ]);
  }
}

export async function completeWithOwnKey(
  llm: LlmConfig,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): Promise<string> {
  const baseUrl = resolveLlmBaseUrl(llm);
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${llm.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: llm.model, messages }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${llm.provider} ${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("LLM returned no content");
  return content;
}

export default RAGX;
