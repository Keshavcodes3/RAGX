import type { StructuredDocument } from "../Document/types";

export type StructuredChunkKind = "text" | "table" | "image";

export interface StructuredChunk {
  id: string;
  kind: StructuredChunkKind;
  /** Embeddable text: header context + content. Tables use markdown. */
  text: string;
  /** LLM-ready markdown for the same content. */
  markdown: string;
  page: number;
  fileName: string;
  headerPath: string[];
  /** Table rows for table chunks, else empty. */
  rows?: string[][];
  /** Image name for image chunks. */
  imageName?: string;
}

export interface StructuredChunkOptions {
  chunkSize?: number;
  overlap?: number;
  includeImageRefs?: boolean;
}

function splitWithOverlap(text: string, chunkSize: number, overlap: number): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= chunkSize) return [clean];

  const chunks: string[] = [];
  const step = chunkSize - overlap;
  for (let start = 0; start < clean.length; start += step) {
    const slice = clean.slice(start, start + chunkSize).trim();
    if (slice) chunks.push(slice);
    if (start + chunkSize >= clean.length) break;
  }
  return chunks;
}

function headerPrefix(headerPath: string[]): string {
  if (headerPath.length === 0) return "";
  return headerPath.join(" > ");
}

export function structuredChunk(
  doc: StructuredDocument,
  options: StructuredChunkOptions = {},
): StructuredChunk[] {
  const chunkSize = options.chunkSize ?? 1000;
  const overlap = options.overlap ?? 200;
  const includeImageRefs = options.includeImageRefs ?? true;

  if (chunkSize <= 0) throw new Error("chunkSize must be greater than 0");
  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error("overlap must be >= 0 and less than chunkSize");
  }

  const chunks: StructuredChunk[] = [];
  let seq = 0;
  const nextId = (page: number, kind: string) => `${doc.fileName}:p${page}:${kind}:${seq++}`;

  // Document-level header context carried across pages.
  let currentPath: string[] = [];

  for (const page of doc.pages) {
    // Page headers arrive in line order from detectHeaders — treat each
    // as the current section. Keep only the latest trail to avoid unbounded growth.
    for (const h of page.headers) {
      const last = currentPath[currentPath.length - 1];
      if (last !== h.text) {
        currentPath = [...currentPath, h.text].slice(-3);
      }
    }

    const prefix = headerPrefix(currentPath);

    // 1. Text blocks: paragraph-join, then sliding window so no chunk
    // loses its section context.
    const paragraphs = page.text
      .split(/\n{2,}|\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const joined = paragraphs.join("\n\n");
    const body = prefix ? `${prefix}\n\n${joined}` : joined;

    for (const slice of splitWithOverlap(body, chunkSize, overlap)) {
      chunks.push({
        id: nextId(page.pageNumber, "text"),
        kind: "text",
        text: slice,
        markdown: slice,
        page: page.pageNumber,
        fileName: doc.fileName,
        headerPath: [...currentPath],
      });
    }

    // 2. Tables: NEVER split. One table = one chunk, header context prepended.
    for (const table of page.tables) {
      const tableText = prefix
        ? `${prefix}\n\n${table.markdown}`
        : table.markdown;
      chunks.push({
        id: nextId(page.pageNumber, "table"),
        kind: "table",
        text: tableText,
        markdown: tableText,
        page: page.pageNumber,
        fileName: doc.fileName,
        headerPath: [...currentPath],
        rows: table.rows,
      });
    }

    // 3. Images: ref-only chunk (no pixels in embeddings).
    if (includeImageRefs) {
      for (const img of page.images) {
        const ref = `Image ${img.name} on page ${page.pageNumber} (${img.width}x${img.height})`;
        const text = prefix ? `${prefix}\n\n${ref}` : ref;
        chunks.push({
          id: nextId(page.pageNumber, "image"),
          kind: "image",
          text,
          markdown: `![${img.name} (p.${page.pageNumber})]`,
          page: page.pageNumber,
          fileName: doc.fileName,
          headerPath: [...currentPath],
          imageName: img.name,
        });
      }
    }
  }

  return chunks;
}
