
export type BlockType = "header" | "text" | "table" | "image";

export interface DocumentHeader {
  level: number;
  text: string;
  pageNumber: number;
}

export interface DocumentTable {
  pageNumber: number;
  index: number;
  rows: string[][];
  markdown: string;
}

export interface DocumentImage {
  pageNumber: number;
  index: number;
  name: string;
  width: number;
  height: number;
  kind: number | string;
  /** Optional base64 data URL (`data:image/...`). Omitted by default to keep payloads small. */
  dataUrl?: string;
}

export interface StructuredPage {
  pageNumber: number;
  /** Raw page text (paragraphs preserved). */
  text: string;
  headers: DocumentHeader[];
  tables: DocumentTable[];
  images: DocumentImage[];
  /** Page rendered as markdown, order: headers/text/tables/images. */
  markdown: string;
}

export interface StructuredDocument {
  fileName: string;
  totalPages: number;
  pages: StructuredPage[];
  /** Full-document markdown (all pages joined, structure preserved). */
  markdown: string;
  /** Full-document plain text (fallback for embeddings). */
  text: string;
  headers: DocumentHeader[];
  tableCount: number;
  imageCount: number;
}

export interface PdfStructuredOptions {
  /** Skip images with width OR height <= threshold. Default 30. Use 0 to keep all. */
  imageThreshold?: number;
  /** Include base64 dataUrl per image. Default false (metadata only). */
  includeImageData?: boolean;
}

// ---------------------------------------------------------------------------
// Parser → Cleaner normalized model (format-agnostic).
//
// Every Parser returns a ParsedDocument: pages of ORDERED blocks. Downstream
// stages (Cleaner, future Chunker) only depend on this shape and never on
// whether the source was PDF, DOCX, HTML, etc.
// ---------------------------------------------------------------------------

export interface TextBlock {
  type: "text";
  content: string;
}

export interface HeadingBlock {
  type: "header";
  level: number;
  content: string;
}

export interface TableBlock {
  type: "table";
  /** Markdown rendering of the table (chunker/LLM-ready). */
  content: string;
  rows: string[][];
}

export interface ImageBlock {
  type: "image";
  /** Human-readable reference, e.g. "Image img-0 on page 2 (120x80)". */
  content?: string;
  name?: string;
  width?: number;
  height?: number;
  kind?: number | string;
}

export type ParsedBlock = TextBlock | HeadingBlock | TableBlock | ImageBlock;

export interface ParsedPage {
  pageNumber: number;
  blocks: ParsedBlock[];
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  [key: string]: unknown;
}

export interface ParsedDocument {
  pages: ParsedPage[];
  metadata: DocumentMetadata;
}

// CleanDocument reuses the parsed block shape on purpose: cleaning must NOT
// flatten structure. Nominally distinct so the future chunker can type
// against the cleaned stage explicitly.
export type CleanBlock = ParsedBlock;

export type CleanPage = ParsedPage;

export interface CleanDocument {
  pages: CleanPage[];
  metadata: DocumentMetadata;
}
