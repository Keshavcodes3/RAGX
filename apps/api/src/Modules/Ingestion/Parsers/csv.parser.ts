import { parse } from "csv-parse/sync"

import { tableToMarkdown } from "../Document/tables"
import type { ParsedBlock, ParsedDocument } from "../Document/types"
import {
  DocumentEmptyError,
  DocumentParseError,
} from "../Errors/document.errors"
import type { Parser, ParserInput } from "./parser"

function normalizeMime(mimeType: string): string {
  return mimeType.split(";")[0]!.trim().toLowerCase()
}

/**
 * CSV → ParsedDocument.
 * Single page; the full sheet becomes one table block plus one text
 * block per data row (`col: value` lines) so both structured and
 * semantic consumers stay useful.
 */
export class CsvParser implements Parser {
  readonly name = "csv"

  supports(mimeType: string): boolean {
    return normalizeMime(mimeType) === "text/csv"
  }

  async parse(input: ParserInput): Promise<ParsedDocument> {
    const data = Buffer.isBuffer(input.data)
      ? input.data
      : Buffer.from(input.data)

    if (data.length === 0) {
      throw new DocumentEmptyError("CSV document is empty (0 bytes)")
    }

    let text: string
    try {
      text = data.toString("utf-8").replace(/^﻿/, "").trim()
    } catch (error) {
      throw new DocumentParseError("Failed to parse CSV document", {
        cause: error,
      })
    }

    if (!text) {
      throw new DocumentEmptyError(
        "CSV document contains no extractable content",
      )
    }

    let rows: string[][]
    try {
      rows = parse(text, {
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      }) as string[][]
    } catch (error) {
      throw new DocumentParseError("Failed to parse CSV document", {
        cause: error,
      })
    }

    try {
      const cleaned = rows.filter((row) =>
        row.some((cell) => cell.trim().length > 0),
      )

      if (cleaned.length === 0) {
        throw new DocumentEmptyError(
          "CSV document contains no extractable content",
        )
      }

      const header = cleaned[0]!.map((c) => c.trim())
      const blocks: ParsedBlock[] = [
        {
          type: "table",
          content: tableToMarkdown(cleaned),
          rows: cleaned,
        },
      ]

      for (const row of cleaned.slice(1)) {
        const lines = header.map(
          (col, i) => `${col || `column${i + 1}`}: ${(row[i] ?? "").trim()}`,
        )
        const content = lines.filter((l) => l.trim().length > 0).join("\n")
        if (content.trim()) blocks.push({ type: "text", content })
      }

      return { pages: [{ pageNumber: 1, blocks }], metadata: {} }
    } catch (error) {
      if (
        error instanceof DocumentEmptyError ||
        error instanceof DocumentParseError
      ) {
        throw error
      }
      throw new DocumentParseError("Failed to parse CSV document", {
        cause: error,
      })
    }
  }
}
