import { readFile } from "node:fs/promises";
import path from "node:path";

import { hashApiKey } from "@/Utils/generateApiKey";
import { UnauthorizedError } from "@/Utils/httpError";

import { DocumentService } from "../Documents/Services/document.services";
import type { ProviderHeaders } from "../Documents/Services/document.services";
import { RetrievalService } from "../Documents/Services/retrieval.services";
import { createEmbeddingProvider } from "../Ingestion/Embeddings/embedding.registry";
import type { EmbeddingProvider } from "../Ingestion/Embeddings/embedding.types";
import { ProjectRepository } from "../Projects/Repository/project.repo";

import { RAGX_PROVIDER_NAMES, isRAGXProviderName } from "@repo/types";
import type {
  AskResult,
  BatchUploadResult,
  Document,
  RAGXProviderName,
  SearchResult,
} from "@repo/types";

export interface RAGXConfig {
  provider: RAGXProviderName;
  providerApiKey: string;
  ragxApiKey: string;
}

export interface RAGXDeps {
  documents?: DocumentService;
  retrieval?: RetrievalService;
  projects?: Pick<ProjectRepository, "findApiKeyByHash">;
}

const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;
export class RAGX {
  /** Embedding provider built once from RAGX config. Also usable directly. */
  readonly embedding: EmbeddingProvider;

  private readonly provider: RAGXProviderName;
  private readonly providerApiKey: string;
  private readonly ragxApiKey: string;

  private readonly documents: DocumentService;
  private readonly retrieval: RetrievalService;
  private readonly projects: Pick<ProjectRepository, "findApiKeyByHash">;

  constructor(config: RAGXConfig, deps: RAGXDeps = {}) {
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
    if (!config.ragxApiKey?.trim()) {
      throw new Error("RAGX initialization failed: ragxApiKey is required.");
    }

    this.provider = config.provider;
    this.providerApiKey = config.providerApiKey;
    this.ragxApiKey = config.ragxApiKey;

    this.embedding = createEmbeddingProvider(
      this.provider,
      this.providerApiKey,
    );

    this.documents = deps.documents ?? new DocumentService();
    this.retrieval = deps.retrieval ?? new RetrievalService();
    this.projects = deps.projects ?? new ProjectRepository();
  }

  private providerHeaders = (): ProviderHeaders => ({
    providerName: this.provider,
    providerKey: this.providerApiKey,
  });

  private projectId = async (): Promise<string> => {
    const record = await this.projects.findApiKeyByHash(
      hashApiKey(this.ragxApiKey),
    );
    if (!record) {
      throw new UnauthorizedError("Invalid or revoked API key");
    }
    return record.projectId;
  };

  private topK = (value?: number): number => {
    if (value === undefined) return DEFAULT_TOP_K;
    if (!Number.isInteger(value) || value < 1 || value > MAX_TOP_K) {
      throw new Error(`topK must be an integer between 1 and ${MAX_TOP_K}`);
    }
    return value;
  };

  private query = (value: string): string => {
    if (!value?.trim()) throw new Error("Query is required");
    return value.trim();
  };

  upload = async (
    file: string | Uint8Array,
    name?: string,
  ): Promise<Document> => {
    const projectId = await this.projectId();

    let bytes: Buffer;
    let fileName = name?.trim();
    if (typeof file === "string") {
      bytes = await readFile(file);
      fileName ||= path.basename(file);
    } else {
      bytes = Buffer.from(file);
      fileName ||= "document";
    }

    return this.documents.upload(
      projectId,
      { name: fileName, contentBase64: bytes.toString("base64") },
      this.providerHeaders(),
    );
  };

  uploadBatch = async (
    files: (string | Uint8Array)[],
    name?: string,
  ): Promise<BatchUploadResult> => {
    const projectId = await this.projectId();

    // One call per file would work, but a single batch keeps one
    // request while the server still fans out independent jobs.
    const normalized = await Promise.all(
      files.map(async (file) => {
        if (typeof file === "string") {
          const bytes = await readFile(file);
          return {
            filename: name?.trim() || path.basename(file),
            contentBase64: bytes.toString("base64"),
          };
        }
        return {
          filename: name?.trim() || "document",
          contentBase64: Buffer.from(file).toString("base64"),
        };
      }),
    );

    return this.documents.uploadBatch(
      projectId,
      normalized,
      this.providerHeaders(),
    );
  };

  listDocuments = async (): Promise<Document[]> => {
    return this.documents.list(await this.projectId());
  };

  deleteDocument = async (documentId: string): Promise<void> => {
    if (!documentId?.trim()) throw new Error("Document ID is required");
    await this.documents.remove(documentId, await this.projectId());
  };

  search = async (
    query: string,
    topK?: number,
  ): Promise<SearchResult[]> => {
    return this.retrieval.search(
      await this.projectId(),
      this.query(query),
      this.topK(topK),
      this.providerHeaders(),
    );
  };

  ask = async (query: string, topK?: number): Promise<AskResult> => {
    return this.retrieval.ask(
      await this.projectId(),
      this.query(query),
      this.topK(topK),
      this.providerHeaders(),
    );
  };
}
