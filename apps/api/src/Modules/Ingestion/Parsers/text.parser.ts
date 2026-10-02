import type { ParsedDocument } from "../Document/types"
import {
  DocumentEmptyError,
  DocumentParseError,
} from "../Errors/document.errors"
import type { Parser, ParserInput } from "./parser"

function normalizeMime(mimeType: string): string {
  return mimeType.split(";")[0]!.trim().toLowerCase()
}

function toBuffer(data: Buffer | Uint8Array): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from(data)
}

/** Split plain text into paragraphs on blank lines, preserving single newlines. */
function splitParagraphs(text: string): string[] {
  return text
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

/**
 * Plain text → ParsedDocument.
 *
 * Single page (pageNumber 1); each paragraph becomes an ordered text block.
 * No format knowledge beyond paragraph boundaries — cleaning stays in
 * DefaultCleaner.
 */
export class TextParser implements Parser {
  readonly name = "txt"

  supports(mimeType: string): boolean {
    return normalizeMime(mimeType) === "text/plain"
  }

  async parse(input: ParserInput): Promise<ParsedDocument> {
    const data = toBuffer(input.data)
    if (data.length === 0) {
      throw new DocumentEmptyError("Text document is empty (0 bytes)")
    }

    let text: string
    try {
      text = data.toString("utf-8")
    } catch (error) {
      throw new DocumentParseError("Failed to parse text document", {
        cause: error,
      })
    }

    if (text.trim().length === 0) {
      throw new DocumentEmptyError("Text document contains no extractable content")
    }

    const blocks = splitParagraphs(text).map((content) => ({
      type: "text" as const,
      content,
    }))

    if (blocks.length === 0) {
      throw new DocumentEmptyError("Text document contains no extractable content")
    }

    return { pages: [{ pageNumber: 1, blocks }], metadata: {} }
  }
}
