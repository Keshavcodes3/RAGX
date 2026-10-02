
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  RAGX_PROVIDER_NAMES,
  isRAGXProviderName,
} from "@repo/types";
import type {
  AskResult,
  BatchUploadResult,
  Document,
  RAGXConfig,
  RAGXProviderName,
  SearchResult,
} from "@repo/types";

export type {
  AskResult,
  BatchUploadResult,
  Document,
  RAGXConfig,
  RAGXProviderName,
  SearchResult,
};

export type { LoadedDocument, LoadOptions } from "./loader.js";
import { loadDocument, loadDocuments } from "./loader.js";
import type {
  LoadBatchItem,
  LoadInput,
  LoadOptions,
  LoadedDocument,
} from "./loader.js";


export const DEFAULT_BASE_URL = "https://api.ragx.dev";

function assertBaseUrl(baseUrl: unknown): string {
  if (baseUrl === undefined) return DEFAULT_BASE_URL;
  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    throw new Error(
      "RAGX initialization failed: baseUrl must be a valid http(s) URL.",
    );
  }
  const trimmed = baseUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      "RAGX initialization failed: baseUrl must be a valid http(s) URL.",
    );
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      "RAGX initialization failed: baseUrl must be a valid http(s) URL.",
    );
  }
  return trimmed.replace(/\/+$/, "");
}

function assertConfig(config: RAGXConfig): {
  provider: RAGXProviderName;
  providerApiKey: string;
  ragxApiKey: string;
  baseUrl: string;
} {
  if (!config || !isRAGXProviderName(config.provider)) {
    throw new Error(
      `RAGX initialization failed: provider must be one of ${RAGX_PROVIDER_NAMES.join(", ")}.`,
    );
  }
  if (!config.providerApiKey?.trim()) {
    throw new Error(
      `RAGX initialization failed: providerApiKey is required when provider="${config.provider}".`,
    );
  }
  // Canonical `apiKey`, with legacy `ragxApiKey` as an alias. Both
  // supplied but different means ambiguous credentials — fail fast
  // instead of silently picking one.
  const apiKey = config.apiKey?.trim() ? config.apiKey : undefined;
  const legacyKey =
    config.ragxApiKey?.trim() ? config.ragxApiKey : undefined;
  if (apiKey && legacyKey && apiKey !== legacyKey) {
    throw new Error(
      "RAGX initialization failed: apiKey and ragxApiKey must match when both are supplied.",
    );
  }
  const ragxApiKey = apiKey ?? legacyKey;
  if (!ragxApiKey?.trim()) {
    throw new Error(
      "RAGX initialization failed: apiKey is required.",
    );
  }
  return {
    provider: config.provider,
    providerApiKey: config.providerApiKey,
    ragxApiKey,
    baseUrl: assertBaseUrl(config.baseUrl),
  };
}

export interface SearchOptions {
  topK?: number;
}

export interface UploadOptions {
  /** Defaults to the file name (or "document" for raw bytes). */
  name?: string;
  /** Defaults to server-side detection from the name. */
  mimeType?: string;
}

/** Anything the SDK can turn into bytes: path, buffer, or web Blob. */
export type UploadInput = string | Uint8Array | Blob;

/** One file inside a batch, with its own name when bytes carry none. */
export interface BatchFileInput {
  data: UploadInput;
  name?: string;
  mimeType?: string;
}

function isBatchItem(
  file: UploadInput | BatchFileInput,
): file is BatchFileInput {
  return (
    typeof file === "object" && file !== null && "data" in file
  );
}

export class RAGX {
  private readonly provider: RAGXProviderName;
  private readonly providerApiKey: string;
  private readonly ragxApiKey: string;
  private readonly baseUrl: string;

  readonly documents: {
    upload(file: UploadInput, opts?: UploadOptions): Promise<Document>;
    upload(
      files: (UploadInput | BatchFileInput)[],
      opts?: UploadOptions,
    ): Promise<BatchUploadResult>;
    list(): Promise<Document[]>;
    delete(documentId: string): Promise<void>;
  };

  /**
   * Local document loading. Normalizes paths, bytes, and Blobs into
   * `LoadedDocument`s that feed the ingestion pipeline (via
   * `documents.upload()`). Local-only — no remote URL loading.
   */
  readonly loader: {
    load(
      input: LoadInput | BatchFileInput,
      opts?: LoadOptions,
    ): Promise<LoadedDocument>;
    load(
      inputs: LoadBatchItem[],
      opts?: LoadOptions,
    ): Promise<LoadedDocument[]>;
  };

  constructor(config: RAGXConfig) {
    const valid = assertConfig(config);
    this.provider = valid.provider;
    // Kept in memory only. Sent to the RAGX server per request over the
    // provider headers — never to the provider directly, never logged.
    this.providerApiKey = valid.providerApiKey;
    this.ragxApiKey = valid.ragxApiKey;
    this.baseUrl = valid.baseUrl;

    this.documents = {
      upload: ((
        file: UploadInput | (UploadInput | BatchFileInput)[],
        opts?: UploadOptions,
      ): Promise<Document | BatchUploadResult> => {
        if (Array.isArray(file)) {
          return this.uploadBatch(file, opts);
        }
        return this.uploadDocument(file, opts);
      }) as {
        (file: UploadInput, opts?: UploadOptions): Promise<Document>;
        (
          files: (UploadInput | BatchFileInput)[],
          opts?: UploadOptions,
        ): Promise<BatchUploadResult>;
      },
      list: () => this.listDocuments(),
      delete: (documentId) => this.deleteDocument(documentId),
    };

    this.loader = {
      load: ((
        input: LoadInput | BatchFileInput | LoadBatchItem[],
        opts?: LoadOptions,
      ): Promise<LoadedDocument | LoadedDocument[]> => {
        if (Array.isArray(input)) {
          return loadDocuments(input, opts);
        }
        return loadDocument(input, opts);
      }) as {
        (
          input: LoadInput | BatchFileInput,
          opts?: LoadOptions,
        ): Promise<LoadedDocument>;
        (
          inputs: LoadBatchItem[],
          opts?: LoadOptions,
        ): Promise<LoadedDocument[]>;
      },
    };
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.ragxApiKey}`,
      "X-Provider": this.provider,
      "X-Provider-Key": this.providerApiKey,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    operation: string,
    path: string,
    init: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method: init.method ?? "GET",
        headers: this.headers(),
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
    } catch {
      throw new Error(`RAGX ${operation} failed: unreachable server`);
    }

    const data = (await res.json().catch(() => null)) as {
      message?: string;
      data?: T;
    } | null;

    if (!res.ok) {
      throw new Error(
        `RAGX ${operation} failed (${res.status}): ${data?.message ?? "request failed"}`,
      );
    }
    return (data?.data ?? null) as T;
  }

  private async toUploadFile(
    file: UploadInput,
    opts: UploadOptions = {},
  ): Promise<{ filename: string; mimeType?: string; contentBase64: string }> {
    if (typeof file === "string") {
      const bytes = await readFile(file);
      return {
        filename: opts.name ?? path.basename(file),
        ...(opts.mimeType ? { mimeType: opts.mimeType } : {}),
        contentBase64: bytes.toString("base64"),
      };
    }

    if (typeof Blob !== "undefined" && file instanceof Blob) {
      const bytes = Buffer.from(new Uint8Array(await file.arrayBuffer()));
      const mimeType = opts.mimeType ?? file.type ?? undefined;
      return {
        filename: opts.name ?? "document",
        ...(mimeType ? { mimeType } : {}),
        contentBase64: bytes.toString("base64"),
      };
    }

    const bytes = Buffer.from(file as Uint8Array);
    return {
      filename: opts.name ?? "document",
      ...(opts.mimeType ? { mimeType: opts.mimeType } : {}),
      contentBase64: bytes.toString("base64"),
    };
  }

  private async uploadDocument(
    file: UploadInput,
    opts: UploadOptions = {},
  ): Promise<Document> {
    const single = await this.toUploadFile(file, opts);

    return this.request<Document>("upload", "/v1/documents", {
      method: "POST",
      body: {
        name: single.filename,
        ...(single.mimeType ? { mimeType: single.mimeType } : {}),
        contentBase64: single.contentBase64,
      },
    });
  }

  private async uploadBatch(
    files: (UploadInput | BatchFileInput)[],
    opts: UploadOptions = {},
  ): Promise<BatchUploadResult> {
    // One API call; the server fans out to independent per-document jobs.
    const normalized = await Promise.all(
      files.map((file) => {
        if (isBatchItem(file)) {
          return this.toUploadFile(file.data, {
            name: file.name ?? opts.name,
            mimeType: file.mimeType ?? opts.mimeType,
          });
        }
        return this.toUploadFile(file, opts);
      }),
    );

    return this.request<BatchUploadResult>("upload", "/v1/documents/batch", {
      method: "POST",
      body: { files: normalized },
    });
  }

  private async listDocuments(): Promise<Document[]> {
    return this.request<Document[]>("list", "/v1/documents");
  }

  private async deleteDocument(documentId: string): Promise<void> {
    await this.request<unknown>("delete", `/v1/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  async search(query: string, opts: SearchOptions = {}): Promise<SearchResult[]> {
    const data = await this.request<{ results: SearchResult[] }>(
      "search",
      "/v1/search",
      {
        method: "POST",
        body: { query, topK: opts.topK ?? 5 },
      },
    );
    return data.results;
  }

  async retrieve(
    query: string,
    opts: SearchOptions = {},
  ): Promise<SearchResult[]> {
    return this.search(query, opts);
  }

  async ask(query: string, opts: SearchOptions = {}): Promise<AskResult> {
    return this.request<AskResult>("ask", "/v1/ask", {
      method: "POST",
      body: { query, topK: opts.topK ?? 5 },
    });
  }
}

export default RAGX;
