import { randomUUID } from "node:crypto";

import { HttpError, NotFoundError } from "@/Utils/httpError";

import { toStructuredDocument } from "../../Ingestion/Document/adapters";
import { createEmbeddingProvider } from "../../Ingestion/Embeddings/embedding.registry";
import { DocumentEmptyError } from "../../Ingestion/Errors/document.errors";
import { structuredChunk } from "../../Ingestion/Chunking/structured.chunking";
import {
  detectMimeType,
  ingestDocument,
} from "../../Ingestion/Pipeline/ingestion";
import { resolveRequestProvider } from "../../Providers/Runtime/resolution";
import type { ResolvedProvider } from "../../Providers/Runtime/resolution";
import { ProviderService } from "../../Providers/Services/provider.services";
import {
  documentObjectKey,
  getObjectStorage,
} from "../../Storage/objectStorage";
import type { ObjectStorage } from "../../Storage/objectStorage";
import { DocumentRepository } from "../Repository/document.repo";
import { enqueueDocumentJob } from "../Jobs/document.jobs";

import type {
  BatchDocumentSummary,
  BatchUploadResult,
  Document,
} from "@repo/types";

const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const EMBED_BATCH_SIZE = 32;

export interface ProviderHeaders {
  providerName?: unknown;
  providerKey?: unknown;
}

export interface UploadFileInput {
  filename: string;
  mimeType?: string;
  contentBase64: string;
}

function toDocumentMeta(row: {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  status: string | null;
  chunkCount: number | null;
  createdAt: Date;
}): Document {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mimeType,
    size: row.size,
    status: (row.status ?? "PENDING") as Document["status"],
    chunks: row.chunkCount ?? 0,
    createdAt: row.createdAt.toISOString(),
  };
}

function toSummary(
  filename: string,
  status: BatchDocumentSummary["status"],
  id: string | null = null,
  error?: string,
): BatchDocumentSummary {
  return error === undefined
    ? { id, filename, status }
    : { id, filename, status, error };
}

function safeFailureMessage(error: unknown): string {
  if (error instanceof HttpError) return error.message;
  return "Document processing failed";
}

function decodeContent(contentBase64: string): Buffer {
  const buffer = Buffer.from(contentBase64, "base64");
  if (buffer.length === 0 || buffer.length > MAX_DOCUMENT_BYTES) {
    throw new DocumentEmptyError(
      "Document content is empty or exceeds the 15MB limit",
    );
  }
  return buffer;
}

export class DocumentService {
  constructor(
    private readonly documentRepository = new DocumentRepository(),
    private readonly providerService = new ProviderService(),
    private readonly storage: ObjectStorage = getObjectStorage(),
    private readonly enqueue: typeof enqueueDocumentJob = enqueueDocumentJob,
  ) {}

  /**
   * Single upload: validate → persist PENDING row → store original in
   * object storage → enqueue an independent background job.
   * Processing happens asynchronously; poll GET for status.
   */
  async upload(
    projectId: string,
    input: { name: string; mimeType?: string; contentBase64: string },
    providerHeaders: ProviderHeaders = {},
  ): Promise<Document> {
    const fileName = input.name.trim();
    if (!fileName) {
      throw new DocumentEmptyError("Document name is required");
    }
    const buffer = decodeContent(input.contentBase64);
    const mimeType = detectMimeType(fileName, input.mimeType);

    // The id is generated up front so the object key is known before
    // the first insert — no placeholder references, no extra roundtrip.
    const id = randomUUID();
    const created = await this.documentRepository.createDocument({
      id,
      projectId,
      filename: fileName,
      mimeType,
      size: buffer.length,
      objectKey: documentObjectKey(projectId, id),
    });

    if (!created) {
      throw new Error("Failed to create document");
    }

    try {
      await this.storage.upload(created.objectKey, buffer, mimeType);
    } catch (error) {
      await this.documentRepository.markFailed(
        created.id,
        safeFailureMessage(error),
      );
      throw error;
    }

    this.enqueue({
      documentId: created.id,
      projectId,
      providerName: providerHeaders.providerName,
      providerKey: providerHeaders.providerKey,
    });

    const row = await this.documentRepository.findByIdAndProject(
      created.id,
      projectId,
    );
    if (!row) throw new Error("Failed to load document");
    return toDocumentMeta(row);
  }

  /**
   * Batch upload: one row + one independent job per file. A failure in
   * one file never fails the others; each outcome is reported inline.
   */
  async uploadBatch(
    projectId: string,
    files: UploadFileInput[],
    providerHeaders: ProviderHeaders = {},
  ): Promise<BatchUploadResult> {
    const documents: BatchDocumentSummary[] = [];

    for (const file of files) {
      const filename = file.filename?.trim() || "document";
      try {
        const doc = await this.upload(
          projectId,
          {
            name: filename,
            mimeType: file.mimeType,
            contentBase64: file.contentBase64,
          },
          providerHeaders,
        );
        documents.push(toSummary(doc.filename, "PENDING", doc.id));
      } catch (error) {
        documents.push(
          toSummary(filename, "FAILED", null, safeFailureMessage(error)),
        );
      }
    }

    return { documents };
  }

  /**
   * Background worker entry: exactly one document lifecycle.
   * PENDING → PROCESSING → COMPLETED, or FAILED with a safe message.
   */
  async processDocument(
    projectId: string,
    documentId: string,
    providerHeaders: ProviderHeaders = {},
  ): Promise<BatchDocumentSummary> {
    const row = await this.documentRepository.findById(documentId);

    if (!row || row.projectId !== projectId) {
      throw new NotFoundError("Document not found");
    }
    if (row.status === "COMPLETED") {
      return toSummary(row.filename, "COMPLETED", row.id);
    }

    try {
      await this.documentRepository.markProcessing(documentId);

      const resolved = await resolveRequestProvider(
        projectId,
        providerHeaders,
        this.providerService,
      );

      const buffer = await this.storage.download(row.objectKey);
      const fileName = row.filename;

      // Internal pipeline: parse → clean → chunk. RAGX chooses the
      // chunker; the client never sends strategy configuration.
      const { cleaned } = await ingestDocument({
        data: buffer,
        fileName,
        mimeType: row.mimeType,
      });
      const chunks = structuredChunk(toStructuredDocument(cleaned, fileName));

      if (chunks.length === 0) {
        throw new DocumentEmptyError("Document produced no chunks");
      }

      const vectors = await this.embedTexts(
        resolved,
        chunks.map((c) => c.text),
      );

      await this.documentRepository.insertChunks(
        chunks.map((chunk, i) => ({
          documentId,
          projectId,
          page: chunk.page,
          text: chunk.text,
          embedding: vectors[i]!,
          metadata: { page: chunk.page, chunkIndex: i },
        })),
      );
      await this.documentRepository.markCompleted(documentId, chunks.length);

      return toSummary(row.filename, "COMPLETED", documentId);
    } catch (error) {
      await this.documentRepository.markFailed(
        documentId,
        safeFailureMessage(error),
      );
      throw error;
    }
  }

  async get(documentId: string, projectId: string): Promise<Document> {
    const row = await this.documentRepository.findByIdAndProject(
      documentId,
      projectId,
    );
    if (!row) {
      throw new NotFoundError("Document not found");
    }
    return toDocumentMeta(row);
  }

  async list(projectId: string): Promise<Document[]> {
    const rows = await this.documentRepository.listByProject(projectId);
    return rows.map(toDocumentMeta);
  }

  async remove(documentId: string, projectId: string) {
    const row = await this.documentRepository.findByIdAndProject(
      documentId,
      projectId,
    );

    if (!row) {
      throw new NotFoundError("Document not found");
    }

    const deleted = await this.documentRepository.deleteByIdAndProject(
      documentId,
      projectId,
    );

    if (!deleted) {
      throw new NotFoundError("Document not found");
    }

    // Best-effort: the DB row is authoritative; a missing object must
    // never fail the delete.
    if (row.objectKey) {
      await this.storage.delete(row.objectKey).catch(() => undefined);
    }

    return deleted;
  }

  private async embedTexts(
    resolved: ResolvedProvider,
    texts: string[],
  ): Promise<number[][]> {
    // One embedding configuration for the whole upload, built through
    // the registry — ingestion never configures providers itself.
    const embedding = createEmbeddingProvider(
      resolved.provider,
      resolved.apiKey,
      resolved.embeddingModel,
    );
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
      const result = await embedding.embed(batch);
      if (result.length !== batch.length) {
        throw new Error("Embedding count does not match chunk count");
      }
      vectors.push(...result);
    }
    return vectors;
  }
}
