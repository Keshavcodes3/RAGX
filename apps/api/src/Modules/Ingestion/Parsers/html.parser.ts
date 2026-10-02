import * as cheerio from "cheerio"

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
 * HTML → ParsedDocument.
 * Single page; h1-h4 become header blocks, tables become table blocks,
 * p/li/pre/blockquote become text blocks. Scripts, styles and other
 * non-content elements are stripped before extraction.
 */
export class HtmlParser implements Parser {
  readonly name = "html"

  supports(mimeType: string): boolean {
    return normalizeMime(mimeType) === "text/html"
  }

  async parse(input: ParserInput): Promise<ParsedDocument> {
    const data = Buffer.isBuffer(input.data)
      ? input.data
      : Buffer.from(input.data)

    if (data.length === 0) {
      throw new DocumentEmptyError("HTML document is empty (0 bytes)")
    }

    let html: string
    try {
      html = data.toString("utf-8").replace(/^﻿/, "").trim()
    } catch (error) {
      throw new DocumentParseError("Failed to parse HTML document", {
        cause: error,
      })
    }

    if (!html) {
      throw new DocumentEmptyError(
        "HTML document contains no extractable content",
      )
    }

    try {
      const $ = cheerio.load(html)
      $("script, style, noscript, iframe, svg, canvas").remove()

      const blocks: ParsedBlock[] = []

      $("h1, h2, h3, h4").each((_, el) => {
        const tag = (el.tagName ?? "").toLowerCase()
        const level =
          tag === "h1" ? 1 : tag === "h2" ? 2 : tag === "h3" ? 3 : 4
        const content = $(el).text().replace(/\s+/g, " ").trim()
        if (content) blocks.push({ type: "header", level, content })
      })

      $("table").each((_, table) => {
        const rows: string[][] = []
        $(table)
          .find("tr")
          .each((__, tr) => {
            const cells: string[] = []
            $(tr)
              .find("th, td")
              .each((___, cell) => {
                cells.push($(cell).text().replace(/\s+/g, " ").trim())
              })
            if (cells.some((c) => c.length > 0)) rows.push(cells)
          })
        if (rows.length > 0) {
          blocks.push({
            type: "table",
            content: tableToMarkdown(rows),
            rows,
          })
        }
      })

      $("p, li, pre, blockquote").each((_, el) => {
        const content = $(el)
          .text()
          .replace(/\r\n?/g, "\n")
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .join("\n")
        if (content) blocks.push({ type: "text", content })
      })

      if (blocks.length === 0) {
        const fallback = $("body")
          .text()
          .replace(/\s+/g, " ")
          .trim()
        if (fallback) blocks.push({ type: "text", content: fallback })
      }

      if (blocks.length === 0) {
        throw new DocumentEmptyError(
          "HTML document contains no extractable content",
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
      throw new DocumentParseError("Failed to parse HTML document", {
        cause: error,
      })
    }
  }
}
