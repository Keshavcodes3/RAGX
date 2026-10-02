import type { ParsedDocument } from "../Document/types"
import {
  DocumentEmptyError,
  DocumentParseError,
} from "../Errors/document.errors"
import type { Parser, ParserInput } from "./parser"

function normalizeMime(mimeType: string): string {
  return mimeType.split(";")[0]!.trim().toLowerCase()
}

function valueToText(key: string | null, value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return null
    return key ? `${key}: ${trimmed}` : trimmed
  }
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    const text = String(value)
    return key ? `${key}: ${text}` : text
  }
  try {
    const text = JSON.stringify(value)
    if (!text || text === "null") return null
    return key ? `${key}: ${text}` : text
  } catch {
    return null
  }
}

/**
 * JSON → ParsedDocument.
 * Single page; objects become `key: value` text blocks, arrays become
 * one text block per element, scalars become a single text block.
 */
export class JsonParser implements Parser {
  readonly name = "json"

  supports(mimeType: string): boolean {
    return normalizeMime(mimeType) === "application/json"
  }

  async parse(input: ParserInput): Promise<ParsedDocument> {
    const data = Buffer.isBuffer(input.data)
      ? input.data
      : Buffer.from(input.data)

    if (data.length === 0) {
      throw new DocumentEmptyError("JSON document is empty (0 bytes)")
    }

    let text: string
    try {
      text = data.toString("utf-8").replace(/^﻿/, "").trim()
    } catch (error) {
      throw new DocumentParseError("Failed to parse JSON document", {
        cause: error,
      })
    }

    if (!text) {
      throw new DocumentEmptyError(
        "JSON document contains no extractable content",
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (error) {
      throw new DocumentParseError("Failed to parse JSON document", {
        cause: error,
      })
    }

    try {
      const blocks: { type: "text"; content: string }[] = []

      if (typeof parsed === "string") {
        const content = parsed.trim()
        if (!content) {
          throw new DocumentEmptyError(
            "JSON document contains no extractable content",
          )
        }
        blocks.push({ type: "text", content })
      } else if (
        typeof parsed === "number" ||
        typeof parsed === "boolean" ||
        typeof parsed === "bigint"
      ) {
        blocks.push({ type: "text", content: String(parsed) })
      } else if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          throw new DocumentEmptyError(
            "JSON document contains no extractable content",
          )
        }
        for (const item of parsed) {
          const content = valueToText(null, item)
          if (content) blocks.push({ type: "text", content })
        }
      } else if (typeof parsed === "object" && parsed !== null) {
        const entries = Object.entries(parsed as Record<string, unknown>)
        if (entries.length === 0) {
          throw new DocumentEmptyError(
            "JSON document contains no extractable content",
          )
        }
        for (const [key, value] of entries) {
          const content = valueToText(key, value)
          if (content) blocks.push({ type: "text", content })
        }
      } else {
        throw new DocumentEmptyError(
          "JSON document contains no extractable content",
        )
      }

      if (blocks.length === 0) {
        throw new DocumentEmptyError(
          "JSON document contains no extractable content",
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
      throw new DocumentParseError("Failed to parse JSON document", {
        cause: error,
      })
    }
  }
}
