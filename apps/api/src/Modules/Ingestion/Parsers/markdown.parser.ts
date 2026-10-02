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

function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return (
    trimmed.startsWith("|") &&
    trimmed.endsWith("|") &&
    trimmed.includes("|", 1)
  )
}

function parseTableRow(line: string): string[] {
  let cells = line.trim()
  if (cells.startsWith("|")) cells = cells.slice(1)
  if (cells.endsWith("|")) cells = cells.slice(0, -1)
  return cells.split("|").map((c) => c.trim())
}

function isSeparatorRow(cells: string[]): boolean {
  return (
    cells.length > 0 &&
    cells.every((c) => /^:?-{2,}:?$/.test(c))
  )
}

/**
 * Markdown → ParsedDocument.
 * Single page; `#` headings become header blocks, `|...|` row groups
 * become table blocks, everything else becomes text blocks. Keeps page
 * boundaries truthful (markdown has no pages) so downstream cleaning
 * and chunking stay format-agnostic.
 */
export class MarkdownParser implements Parser {
  readonly name = "markdown"

  supports(mimeType: string): boolean {
    return normalizeMime(mimeType) === "text/markdown"
  }

  async parse(input: ParserInput): Promise<ParsedDocument> {
    const data = Buffer.isBuffer(input.data)
      ? input.data
      : Buffer.from(input.data)

    if (data.length === 0) {
      throw new DocumentEmptyError("Markdown document is empty (0 bytes)")
    }

    let text: string
    try {
      text = data.toString("utf-8").replace(/^﻿/, "").trim()
    } catch (error) {
      throw new DocumentParseError("Failed to parse markdown document", {
        cause: error,
      })
    }

    if (!text) {
      throw new DocumentEmptyError(
        "Markdown document contains no extractable content",
      )
    }

    try {
      const blocks: ParsedBlock[] = []
      const lines = text.replace(/\r\n?/g, "\n").split("\n")
      let paragraph: string[] = []
      let tableRows: string[][] = []

      const flushParagraph = () => {
        const content = paragraph.join("\n").trim()
        paragraph = []
        if (content) blocks.push({ type: "text", content })
      }

      const flushTable = () => {
        const rows = tableRows.filter((r) =>
          r.some((c) => c.length > 0 && !/^:?-{2,}:?$/.test(c)),
        )
        tableRows = []
        if (rows.length === 0) return
        blocks.push({
          type: "table",
          content: tableToMarkdown(rows),
          rows,
        })
      }

      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line) {
          flushParagraph()
          if (tableRows.length > 0) flushTable()
          continue
        }

        if (isTableRow(rawLine)) {
          flushParagraph()
          const cells = parseTableRow(rawLine)
          if (isSeparatorRow(cells)) continue
          tableRows.push(cells)
          continue
        }

        if (tableRows.length > 0) flushTable()

        const heading = /^(#{1,4})\s+(.+)$/.exec(line)
        if (heading) {
          flushParagraph()
          blocks.push({
            type: "header",
            level: heading[1]!.length,
            content: heading[2]!.trim(),
          })
          continue
        }

        paragraph.push(rawLine.trim())
      }

      flushParagraph()
      if (tableRows.length > 0) flushTable()

      if (blocks.length === 0) {
        throw new DocumentEmptyError(
          "Markdown document contains no extractable content",
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
      throw new DocumentParseError("Failed to parse markdown document", {
        cause: error,
      })
    }
  }
}
