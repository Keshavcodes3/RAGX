import { HttpError } from "@/Utils/httpError";

import type { RAGXProviderName } from "@repo/types";

export interface RAGXProvider {
  readonly name: RAGXProviderName;

  embed(
    input: string[],
    apiKey: string,
    opts?: { model?: string },
  ): Promise<number[][]>;

  generate(
    input: string,
    apiKey: string,
    opts?: { model?: string; system?: string },
  ): Promise<string>;
}

export class ProviderUpstreamError extends HttpError {
  constructor(provider: string, detail = "Provider request failed") {
    super(502, `${provider} request failed: ${detail}`);
  }
}

export async function readJsonResponse(
  provider: string,
  res: Response,
): Promise<unknown> {
  if (!res.ok) {
    throw new ProviderUpstreamError(provider, `status ${res.status}`);
  }
  try {
    return (await res.json()) as unknown;
  } catch {
    throw new ProviderUpstreamError(provider, "invalid response");
  }
}

export function postJson(
  provider: string,
  url: string,
  apiKey: string,
  body: unknown,
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).catch(() => {
    throw new ProviderUpstreamError(provider, "unreachable");
  });
}
