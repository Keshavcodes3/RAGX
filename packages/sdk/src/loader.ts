import type { BatchFileInput, UploadInput } from "./index.js";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Client-side document loading (Phase 2).
 *
 * Normalizes every supported input into a {@link LoadedDocument} that can
 * feed the ingestion pipeline (currently via `documents.upload()`).
 * Loading is local-only: the server receives bytes + a bare filename and
 * never sees client paths, so path traversal cannot become server-side
 * file access.
 *
 * No remote URL loading: URL-like strings are rejected explicitly.
 * No object storage or embeddings here — those belong to later phases.
 */

/** Raw bytes cap per file. Mirrors the server ingestion limit (15MB). */
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

/** Max files per batch `load()` call. Mirrors the server batch limit. */
export const MAX_BATCH_FILES = 20;

/** Extension → MIME inference. Mirrors the server ingestion map. */
const MIME_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".html": "text/html",
  ".htm": "text/html",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".json": "application/json",
};

/** Normalized output: bytes plus the metadata ingestion needs. */
export interface LoadedDocument {
  /** Bare filename (directories stripped — never a client path). */
  name: string;
  /** Resolved MIME type (explicit override wins over inference). */
  mimeType: string;
  /** Byte length of `content`. */
  size: number;
  /** Raw file bytes. */
  content: Uint8Array;
  /** Loader provenance, e.g. `{ source: "file" | "buffer" | "blob" }`. */
  metadata?: Record<string, unknown>;
}

export interface LoadOptions {
  /** Overrides the inferred filename (basename is used). */
  name?: string;
  /** Overrides MIME inference. Must be a well-formed `type/subtype`. */
  mimeType?: string;
}

/** Loader inputs are exactly the upload inputs, so loading feeds upload. */
export type LoadInput = UploadInput;

export type LoadBatchItem = LoadInput | BatchFileInput;

/** Source abstraction. `RemoteSource` is a deliberate future extension. */
export interface DocumentSource {
  readonly kind: "file" | "buffer" | "blob";
  load(): Promise<LoadedDocument>;
}

function loadError(message: string): Error {
  return new Error(`RAGX load failed: ${message}`);
}

function isRemoteUrl(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value.trim());
}

function normalizeName(rawName: unknown): string {
  if (typeof rawName !== "string") {
    throw loadError("filename must be a string.");
  }
  // Strip directories: only a bare filename ever leaves the client.
  const base = path.basename(rawName).trim();
  if (!base) {
    throw loadError("could not determine a filename for the document.");
  }
  return base;
}

function normalizeMimeType(rawMimeType: unknown): string {
  if (typeof rawMimeType !== "string" || !rawMimeType.trim()) {
    throw loadError("mimeType override must be a non-empty string.");
  }
  const mime = rawMimeType.split(";")[0]!.trim().toLowerCase();
  if (!/^[^/\s]+\/[^;\s]+$/.test(mime)) {
    throw loadError(
      `invalid mimeType override "${rawMimeType}". Expected "type/subtype".`,
    );
  }
  return mime;
}

function normalizeOptionalMimeType(
  rawMimeType: unknown,
): string | undefined {
  if (rawMimeType === undefined || rawMimeType === null) return undefined;
  if (typeof rawMimeType === "string" && !rawMimeType.trim()) {
    return undefined;
  }
  try {
    return normalizeMimeType(rawMimeType);
  } catch {
    return undefined;
  }
}

function inferMimeType(name: string): string {
  const ext = path.extname(name).toLowerCase();
  const mime = ext ? MIME_BY_EXTENSION[ext] : undefined;
  if (!mime) {
    throw loadError(
      `unsupported file type for "${name}". Pass an explicit mimeType override.`,
    );
  }
  return mime;
}

function resolveNameAndMime(
  fallbackName: string,
  opts: LoadOptions,
): { name: string; mimeType: string } {
  const name = normalizeName(opts.name ?? fallbackName);
  const mimeType = opts.mimeType
    ? normalizeMimeType(opts.mimeType)
    : inferMimeType(name);
  return { name, mimeType };
}

function splitBatchItem(
  input: LoadInput | BatchFileInput,
  opts: LoadOptions,
): { data: LoadInput; options: LoadOptions } {
  if (
    typeof input === "object" &&
    input !== null &&
    "data" in input
  ) {
    const item = input as BatchFileInput;
    return {
      data: item.data,
      options: {
        name: item.name ?? opts.name,
        mimeType: item.mimeType ?? opts.mimeType,
      },
    };
  }
  return { data: input as LoadInput, options: opts };
}

export class LocalFileSource implements DocumentSource {
  readonly kind = "file" as const;

  constructor(
    private readonly filePath: string,
    private readonly opts: LoadOptions = {},
  ) {}

  async load(): Promise<LoadedDocument> {
    if (typeof this.filePath !== "string" || !this.filePath.trim()) {
      throw loadError(
        "file path must be a non-empty string.",
      );
    }
    if (isRemoteUrl(this.filePath)) {
      throw loadError(
        "remote URL loading is not supported. Pass local paths, bytes, or a Blob.",
      );
    }

    let size = 0;
    try {
      const info = await stat(this.filePath);
      if (info.isDirectory()) {
        throw loadError(`"${this.filePath}" is a directory, not a file.`);
      }
      size = info.size;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("RAGX load")) {
        throw error;
      }
      throw loadError(
        `cannot access file "${this.filePath}".`,
      );
    }

    // Size gate before allocating: huge files are rejected via stat.
    if (size === 0) {
      throw loadError(`file "${this.filePath}" is empty.`);
    }
    if (size > MAX_FILE_BYTES) {
      throw loadError(
        `file "${this.filePath}" exceeds the 15MB limit.`,
      );
    }

    let bytes: Buffer;
    try {
      bytes = await readFile(this.filePath);
    } catch {
      throw loadError(`cannot read file "${this.filePath}".`);
    }
    if (bytes.byteLength === 0) {
      throw loadError(`file "${this.filePath}" is empty.`);
    }
    if (bytes.byteLength > MAX_FILE_BYTES) {
      throw loadError(
        `file "${this.filePath}" exceeds the 15MB limit.`,
      );
    }

    const { name, mimeType } = resolveNameAndMime(
      path.basename(this.filePath),
      this.opts,
    );
    return {
      name,
      mimeType,
      size: bytes.byteLength,
      content: bytes,
      metadata: { source: "file" },
    };
  }
}

export class BufferSource implements DocumentSource {
  readonly kind = "buffer" as const;

  constructor(
    private readonly data: Uint8Array,
    private readonly opts: LoadOptions = {},
  ) {}

  async load(): Promise<LoadedDocument> {
    if (!(this.data instanceof Uint8Array)) {
      throw loadError(
        "unsupported input. Expected a file path, bytes, or Blob.",
      );
    }
    const size = this.data.byteLength;
    if (size === 0) {
      throw loadError("document bytes are empty.");
    }
    if (size > MAX_FILE_BYTES) {
      throw loadError("document bytes exceed the 15MB limit.");
    }

    const { name, mimeType } = resolveNameAndMime("document", this.opts);
    return {
      name,
      mimeType,
      size,
      content: this.data,
      metadata: { source: "buffer" },
    };
  }
}

export class BlobSource implements DocumentSource {
  readonly kind = "blob" as const;

  constructor(
    private readonly blob: Blob,
    private readonly opts: LoadOptions = {},
  ) {}

  async load(): Promise<LoadedDocument> {
    if (typeof Blob === "undefined" || !(this.blob instanceof Blob)) {
      throw loadError(
        "unsupported input. Expected a file path, bytes, or Blob.",
      );
    }
    // Size gate before materializing the bytes.
    const declared = this.blob.size;
    if (declared === 0) {
      throw loadError("Blob is empty.");
    }
    if (declared > MAX_FILE_BYTES) {
      throw loadError("Blob exceeds the 15MB limit.");
    }

    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await this.blob.arrayBuffer());
    } catch {
      throw loadError("cannot read Blob contents.");
    }
    if (bytes.byteLength === 0) {
      throw loadError("Blob is empty.");
    }
    if (bytes.byteLength > MAX_FILE_BYTES) {
      throw loadError("Blob exceeds the 15MB limit.");
    }

    const { name, mimeType } = resolveBlobNameAndMime(
      this.blob,
      this.opts,
    );
    return {
      name,
      mimeType,
      size: bytes.byteLength,
      content: bytes,
      metadata: { source: "blob" },
    };
  }
}

function resolveBlobNameAndMime(
  blob: Blob,
  opts: LoadOptions,
): { name: string; mimeType: string } {
  const name = normalizeName(opts.name ?? "document");
  if (opts.mimeType) {
    return { name, mimeType: normalizeMimeType(opts.mimeType) };
  }
  const blobMime = normalizeOptionalMimeType(
    typeof blob.type === "string" ? blob.type : undefined,
  );
  if (blobMime) return { name, mimeType: blobMime };
  return { name, mimeType: inferMimeType(name) };
}

export function createSource(
  input: LoadInput | BatchFileInput,
  opts: LoadOptions = {},
): DocumentSource {
  const { data, options } = splitBatchItem(input, opts);
  if (typeof data === "string") {
    return new LocalFileSource(data, options);
  }
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    return new BlobSource(data, options);
  }
  if (data instanceof Uint8Array) {
    return new BufferSource(data, options);
  }
  throw loadError(
    "unsupported input. Expected a file path, bytes, or Blob.",
  );
}

export async function loadDocument(
  input: LoadInput | BatchFileInput,
  opts: LoadOptions = {},
): Promise<LoadedDocument> {
  return createSource(input, opts).load();
}

export async function loadDocuments(
  inputs: (LoadInput | BatchFileInput)[],
  opts: LoadOptions = {},
): Promise<LoadedDocument[]> {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw loadError("at least one file is required.");
  }
  if (inputs.length > MAX_BATCH_FILES) {
    throw loadError(
      `at most ${MAX_BATCH_FILES} files per batch.`,
    );
  }
  // Sequential: bounds memory (never all files at once) and preserves order.
  const loaded: LoadedDocument[] = [];
  for (const item of inputs) {
    loaded.push(await createSource(item, opts).load());
  }
  return loaded;
}
