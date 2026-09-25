
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
