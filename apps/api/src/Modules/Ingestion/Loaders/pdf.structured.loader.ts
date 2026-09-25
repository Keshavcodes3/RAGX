import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

import type {
  DocumentHeader,
  PdfStructuredOptions,
  StructuredDocument,
  StructuredPage,
} from "../Document/types";

/**
 * Structured PDF extraction using the already-installed `pdf-parse` v2
 * (Bun-native, no new deps).
 *
 * Single PDFParse instance yields:
 * - getText()  -> per-page text
 * - getTable() -> per-page string[][] tables (line-geometry detection)
 * - getImage() -> per-page embedded images (metadata + optional dataUrl)
 * - getInfo()  -> total page count (fallback to text pages length)
 *
 * Headers are detected heuristically from text lines since the PDF
 * text layer carries no semantic heading tags.
 */

function tableToMarkdown(rows: string[][]): string {
  if (rows.length === 0) return "";
  const escape = (cell: string) => cell.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
  const header = rows[0]!.map(escape);
  const separator = header.map(() => "---");
  const lines = [`| ${header.join(" | ")} |`, `| ${separator.join(" | ")} |`];
  for (const row of rows.slice(1)) {
    const cells = header.map((_, i) => escape(row[i] ?? ""));
    lines.push(`| ${cells.join(" | ")} |`);
  }
  return lines.join("\n");
}

function detectHeaders(pageText: string, pageNumber: number): DocumentHeader[] {
  const headers: DocumentHeader[] = [];
  const lines = pageText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines) {
    if (line.length > 120) continue;

    // Markdown-style heading already in source
    const mdMatch = /^(#{1,4})\s+(.+)$/.exec(line);
    if (mdMatch) {
      headers.push({
        level: mdMatch[1]!.length,
        text: mdMatch[2]!.trim(),
        pageNumber,
      });
      continue;
    }

    // Numbered heading: "1. Introduction", "2.3 MVCC"
    if (/^\d+(\.\d+)*\.?\s+[A-Z].{2,80}$/.test(line) && !line.endsWith(".")) {
      const depth = (line.match(/\./g) ?? []).length;
      headers.push({ level: Math.min(depth + 1, 4), text: line, pageNumber });
      continue;
    }

    // ALL CAPS short line (likely section title)
    if (/^[A-Z][A-Z0-9\s\-_:]{3,60}$/.test(line) && line.split(" ").length <= 8) {
      headers.push({ level: 2, text: line, pageNumber });
      continue;
    }

    // Title Case short line without terminal punctuation
    if (
      line.split(" ").length >= 2 &&
      line.split(" ").length <= 10 &&
      !/[.:;]$/.test(line) &&
      /^[A-Z]/.test(line) &&
      line === line.replace(/\s+/g, " ")
    ) {
      // Only treat as header if it "looks" like a title: mostly letters, no lowercase-heavy sentence
      const words = line.split(" ");
      const capitalized = words.filter((w) => /^[A-Z0-9]/.test(w)).length;
      if (capitalized / words.length >= 0.6) {
        headers.push({ level: 3, text: line, pageNumber });
      }
    }
  }

  return headers;
}

function buildPageMarkdown(args: {
  text: string;
  headers: DocumentHeader[];
  tables: { markdown: string }[];
  imageCount: number;
  pageNumber: number;
}): string {
  const parts: string[] = [];
  const headerTexts = new Set(args.headers.map((h) => h.text));

  for (const paragraph of args.text.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean)) {
    if (headerTexts.has(paragraph)) {
      const h = args.headers.find((x) => x.text === paragraph)!;
      parts.push(`${"#".repeat(h.level)} ${paragraph}`);
    } else {
      parts.push(paragraph);
    }
  }

  for (const t of args.tables) {
    if (t.markdown) parts.push(t.markdown);
  }

  for (let i = 0; i < args.imageCount; i++) {
    parts.push(`![image p${args.pageNumber}-${i}][image p${args.pageNumber}-${i}]`);
  }

  return parts.join("\n\n");
}

export async function readPdfStructured(
  filePath: string,
  options: PdfStructuredOptions = {},
): Promise<StructuredDocument> {
  const absolutePath = path.resolve(filePath);
  const fileName = path.basename(absolutePath);
  const fileBuffer = await fs.readFile(absolutePath);

  const parser = new PDFParse({ data: fileBuffer });

  try {
    const [textResult, tableResult, imageResult, infoResult] = await Promise.all([
      parser.getText(),
      parser.getTable().catch(() => null),
      parser
        .getImage({
          imageThreshold: options.imageThreshold ?? 30,
          imageDataUrl: options.includeImageData ?? false,
          imageBuffer: false,
        })
        .catch(() => null),
      parser.getInfo().catch(() => null),
    ]);

    const totalPages =
      infoResult?.total ?? textResult.total ?? textResult.pages.length;

    const tablesByPage = new Map<number, string[][][]>();
    for (const p of tableResult?.pages ?? []) {
      if (p.tables.length > 0) tablesByPage.set(p.num, p.tables);
    }

    const imagesByPage = new Map<
      number,
      { name: string; width: number; height: number; kind: number | string; dataUrl?: string }[]
    >();
    for (const p of imageResult?.pages ?? []) {
      imagesByPage.set(
        p.pageNumber,
        p.images.map((img) => ({
          name: img.name,
          width: img.width,
          height: img.height,
          kind: img.kind as number | string,
          ...(options.includeImageData && img.dataUrl ? { dataUrl: img.dataUrl } : {}),
        })),
      );
    }

    const pages: StructuredPage[] = textResult.pages.map((page) => {
      const pageNumber = page.num;
      const text = page.text.trim();
      const headers = detectHeaders(text, pageNumber);

      const rawTables = tablesByPage.get(pageNumber) ?? [];
      const tables = rawTables.map((rows, index) => ({
        pageNumber,
        index,
        rows,
        markdown: tableToMarkdown(rows),
      }));

      const rawImages = imagesByPage.get(pageNumber) ?? [];
      const images = rawImages.map((img, index) => ({
        pageNumber,
        index,
        ...img,
      }));

      const markdown = buildPageMarkdown({
        text,
        headers,
        tables,
        imageCount: images.length,
        pageNumber,
      });

      return { pageNumber, text, headers, tables, images, markdown };
    });

    const allHeaders = pages.flatMap((p) => p.headers);
    const markdown = pages
      .map((p) => `<!-- page ${p.pageNumber} -->\n${p.markdown}`)
      .join("\n\n");

    return {
      fileName,
      totalPages,
      pages,
      markdown,
      text: textResult.text.trim(),
      headers: allHeaders,
      tableCount: pages.reduce((n, p) => n + p.tables.length, 0),
      imageCount: pages.reduce((n, p) => n + p.images.length, 0),
    };
  } finally {
    await parser.destroy();
  }
}
