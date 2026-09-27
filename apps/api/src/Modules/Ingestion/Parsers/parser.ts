import type { ParsedDocument } from "../Document/types"

export interface ParserInput {
  /** Raw file bytes (Loader output). */
  data: Buffer | Uint8Array
  /** Original file name, used for metadata/logging only. */
  fileName?: string
  /** MIME type the parser was selected for, e.g. "application/pdf". */
  mimeType?: string
}

export interface Parser {
  /** Stable identifier used in logs/stats, e.g. "pdf". */
  readonly name: string

  /** Whether this parser handles the given MIME type. */
  supports(mimeType: string): boolean

  /**
   * Parse raw bytes into the normalized ParsedDocument.
   * Never returns one giant string: page boundaries and block order
   * must be preserved. Throws DocumentParseError / DocumentEmptyError.
   */
  parse(input: ParserInput): Promise<ParsedDocument>
}
