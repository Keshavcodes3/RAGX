import mammoth from "mammoth"

import type { ParsedDocument } from "../Document/types"
import {
  DocumentEmptyError,
  DocumentParseError,
} from "../Errors/document.errors"
import type { Parser, ParserInput } from "./parser"

function normalizeMime(mimeType: string): string {
  return mimeType.split(";")[0]!.trim().toLowerCase()
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

function splitParagraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

/**
 * DOCX → ParsedDocument via mammoth (already a project dependency).
 * Raw-text extraction only: headings do not survive, so every block is
 * text. Single page; downstream cleaning and chunking stay unchanged.
 */
export class DocxParser implements Parser {
  readonly name = "docx"

  supports(mimeType: string): boolean {
    return normalizeMime(mimeType) === DOCX_MIME
  }

  async parse(input: ParserInput): Promise<ParsedDocument> {
    const data = Buffer.isBuffer(input.data)
      ? input.data
      : Buffer.from(input.data)

    if (data.length === 0) {
      throw new DocumentEmptyError("DOCX document is empty (0 bytes)")
    }

    let raw: string
    try {
      const result = await mammoth.extractRawText({ buffer: data })
      raw = (result.value ?? "").replace(/^﻿/, "").trim()
    } catch (error) {
      if (
        error instanceof DocumentEmptyError ||
        error instanceof DocumentParseError
      ) {
        throw error
      }
      throw new DocumentParseError("Failed to parse DOCX document", {
        cause: error,
      })
    }

    if (!raw) {
      throw new DocumentEmptyError(
        "DOCX document contains no extractable content",
      )
    }

    try {
      const blocks = splitParagraphs(raw).map((content) => ({
        type: "text" as const,
        content,
      }))

      if (blocks.length === 0) {
        throw new DocumentEmptyError(
          "DOCX document contains no extractable content",
        )
      }

      return { pages: [{ pageNumber: 1, blocks }], metadata: {} }
    } catch (error) {
      if (
        error instanceof DocumentEmptyError ||
        error instanceof DocumentParseError
      ) {
        throw error
      }
      throw new DocumentParseError("Failed to parse DOCX document", {
        cause: error,
      })
    }
  }
}
