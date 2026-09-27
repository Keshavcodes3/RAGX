import { PDFParse } from "pdf-parse"

import { tableToMarkdown } from "../Document/tables"
import type {
  DocumentMetadata,
  ParsedBlock,
  ParsedDocument,
  ParsedPage,
} from "../Document/types"
import {
  DocumentEmptyError,
  DocumentParseError,
} from "../Errors/document.errors"
import type { Parser, ParserInput } from "./parser"

export interface PdfParserOptions {
  /** Skip images with width OR height <= threshold. Default 30. Use 0 to keep all. */
  imageThreshold?: number
}

function normalizeMime(mimeType: string): string {
  return mimeType.split(";")[0]!.trim().toLowerCase()
}

/** Paragraph-level heading guess, aligned with the structured loader heuristics. */
function headingLevel(paragraph: string): number | null {
  const line = paragraph.trim()
  if (line.length === 0 || line.length > 120) return null

  const mdMatch = /^(#{1,4})\s+(.+)$/.exec(line)
  if (mdMatch) return mdMatch[1]!.length

  if (/^\d+(\.\d+)*\.?\s+[A-Z].{2,80}$/.test(line) && !line.endsWith(".")) {
    const depth = (line.match(/\./g) ?? []).length
    return Math.min(depth + 1, 4)
  }

  if (/^[A-Z][A-Z0-9\s\-_:]{3,60}$/.test(line) && line.split(" ").length <= 8) {
    return 2
  }

  return null
}

/** Split page text into paragraphs, keeping single newlines for the cleaner. */
function splitParagraphs(pageText: string): string[] {
  return pageText
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n"),
    )
    .filter((p) => p.length > 0)
}

function extractMetadata(info: unknown): DocumentMetadata {
  const metadata: DocumentMetadata = {}
  if (typeof info !== "object" || info === null) return metadata
  // pdf-parse returns the Info dict flat on the result; accept a nested
  // `info` dict too for forward compatibility.
  const root = info as Record<string, unknown>
  const nested =
    typeof root.info === "object" && root.info !== null
      ? (root.info as Record<string, unknown>)
      : undefined
  const dict = nested ?? root

  const pick = (key: string): string | undefined => {
    const value = dict[key]
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : undefined
  }

  const title = pick("Title")
  const author = pick("Author")
  const subject = pick("Subject")
  if (title) metadata.title = title
  if (author) metadata.author = author
  if (subject) metadata.subject = subject
  return metadata
}

/**
 * PDF → ParsedDocument using pdf-parse (already a project dependency).
 *
 * No new PDF library was added: this reuses the same engine as the existing
 * structured loader, but emits ordered page blocks instead of one flat string.
 */
export class PdfParser implements Parser {
  readonly name = "pdf"

  constructor(private readonly options: PdfParserOptions = {}) {}

  supports(mimeType: string): boolean {
    return normalizeMime(mimeType) === "application/pdf"
  }

  async parse(input: ParserInput): Promise<ParsedDocument> {
    const data = Buffer.isBuffer(input.data)
      ? input.data
      : Buffer.from(input.data)

    if (data.length === 0) {
      throw new DocumentEmptyError("PDF is empty (0 bytes)")
    }

    let parser: PDFParse | null = null
    try {
      parser = new PDFParse({ data })

      // Sequential: concurrent getText/getTable/getImage/getInfo calls on
      // one instance can fail (worker DataCloneError), so each step runs
      // alone and tolerates absence of optional structure.
      const textResult = await parser.getText()
      const tableResult = await parser.getTable().catch(() => null)
      const imageResult = await parser
        .getImage({
          imageThreshold: this.options.imageThreshold ?? 30,
          imageDataUrl: false,
          imageBuffer: false,
        })
        .catch(() => null)
      const infoResult = await parser.getInfo().catch(() => null)

      const tablesByPage = new Map<number, string[][][]>()
      for (const page of tableResult?.pages ?? []) {
        if (page.tables.length > 0) tablesByPage.set(page.num, page.tables)
      }

      const imagesByPage = new Map<
        number,
        { name: string; width: number; height: number; kind: number | string }[]
      >()
      for (const page of imageResult?.pages ?? []) {
        imagesByPage.set(
          page.pageNumber,
          page.images.map((img) => ({
            name: img.name,
            width: img.width,
            height: img.height,
            kind: img.kind as number | string,
          })),
        )
      }

      const pages: ParsedPage[] = textResult.pages.map((page) => {
        const blocks: ParsedBlock[] = []

        for (const paragraph of splitParagraphs(page.text)) {
          const level = headingLevel(paragraph)
          if (level !== null) {
            blocks.push({ type: "header", level, content: paragraph })
          } else {
            blocks.push({ type: "text", content: paragraph })
          }
        }

        for (const rows of tablesByPage.get(page.num) ?? []) {
          blocks.push({ type: "table", content: tableToMarkdown(rows), rows })
        }

        for (const img of imagesByPage.get(page.num) ?? []) {
          blocks.push({
            type: "image",
            content: `Image ${img.name} on page ${page.num} (${img.width}x${img.height})`,
            ...img,
          })
        }

        return { pageNumber: page.num, blocks }
      })

      // pdf-parse may omit fully empty pages from textResult; keep whatever
      // it reports so page numbers stay truthful to the extractor.
      const hasContent = pages.some((p) => p.blocks.length > 0)
      if (pages.length === 0 || !hasContent) {
        throw new DocumentEmptyError("PDF contains no extractable content")
      }

      return { pages, metadata: extractMetadata(infoResult) }
    } catch (error) {
      if (
        error instanceof DocumentEmptyError ||
        error instanceof DocumentParseError
      ) {
        throw error
      }
      throw new DocumentParseError("Failed to parse PDF document", {
        cause: error,
      })
    } finally {
      if (parser) {
        await parser.destroy().catch(() => undefined)
      }
    }
  }
}
