import path from "node:path";

import { readPdf } from "./pdf.loader";
import { readTxt } from "./text.loader";
import { readMarkdown } from "./markdown.loader";
import { readHtml } from "./html.loader";
import { readDocx } from "./docx.loader";
import { readCsv } from "./csv.loader";
import { readPdfStructured } from "./pdf.structured.loader";
import type { PdfStructuredOptions, StructuredDocument } from "../Document/types";

export async function loadDocument(filePath: string): Promise<string> {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".pdf":
      return readPdf(filePath);

    case ".txt":
      return readTxt(filePath);

    case ".md":
      return readMarkdown(filePath);

    case ".html":
    case ".htm":
      return readHtml(filePath);

    case ".docx":
      return readDocx(filePath);

      case ".csv":
        return readCsv(filePath)
    default:
      throw new Error(`Unsupported document type: ${extension}`);
  }
}

export async function loadStructuredDocument(
  filePath: string,
  pdfOptions: PdfStructuredOptions = {},
): Promise<StructuredDocument> {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".pdf") {
    return readPdfStructured(filePath, pdfOptions);
  }

  // Non-PDF: wrap plain text in a single-page structured doc so
  // downstream chunking keeps page/block metadata.
  const text = await loadDocument(filePath);
  const fileName = path.basename(filePath);

  return {
    fileName,
    totalPages: 1,
    pages: [
      {
        pageNumber: 1,
        text,
        headers: [],
        tables: [],
        images: [],
        markdown: text,
      },
    ],
    markdown: text,
    text,
    headers: [],
    tableCount: 0,
    imageCount: 0,
  };
}
