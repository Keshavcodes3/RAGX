import { RAGX_CHAT_MODELS, RAGX_EMBEDDING_MODELS } from "@repo/types";

import {
  ProviderUpstreamError,
  postJson,
  readJsonResponse,
} from "./provider";
import type { RAGXProvider } from "./provider";

const BASE_URL = "https://api.openai.com/v1";

interface EmbeddingResponse {
  data?: { embedding?: unknown }[];
}

interface ChatResponse {
  choices?: { message?: { content?: unknown } }[];
}

export class OpenAIProvider implements RAGXProvider {
  readonly name = "openai" as const;

  async embed(
    input: string[],
    apiKey: string,
    opts: { model?: string } = {},
  ): Promise<number[][]> {
    if (input.length === 0) return [];
    const model = opts.model ?? RAGX_EMBEDDING_MODELS.openai;

    const res = await postJson(this.name, `${BASE_URL}/embeddings`, apiKey, {
      model,
      input,
    });
    const data = (await readJsonResponse(this.name, res)) as EmbeddingResponse;

    if (!Array.isArray(data.data) || data.data.length !== input.length) {
      throw new ProviderUpstreamError(this.name, "invalid response");
    }

    return data.data.map((item) => {
      if (!item || !Array.isArray(item.embedding)) {
        throw new ProviderUpstreamError(this.name, "invalid response");
      }
      return item.embedding as number[];
    });
  }

  async generate(
    input: string,
    apiKey: string,
    opts: { model?: string; system?: string } = {},
  ): Promise<string> {
    const model = opts.model ?? RAGX_CHAT_MODELS.openai;

    const res = await postJson(
      this.name,
      `${BASE_URL}/chat/completions`,
      apiKey,
      {
        model,
        messages: [
          ...(opts.system
            ? [{ role: "system", content: opts.system }]
            : []),
          { role: "user", content: input },
        ],
      },
    );
    const data = (await readJsonResponse(this.name, res)) as ChatResponse;
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      throw new ProviderUpstreamError(this.name, "invalid response");
    }
    return content.trim();
  }
}
