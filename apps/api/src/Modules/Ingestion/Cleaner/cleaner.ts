import type { CleanDocument, ParsedDocument } from "../Document/types"

export interface Cleaner {
  /** Stable identifier used in logs/stats, e.g. "default". */
  readonly name: string

  /**
   * Normalize extraction noise on an already-parsed document.
   * Must preserve page numbers, block types and block order.
   */
  clean(document: ParsedDocument): CleanDocument
}
