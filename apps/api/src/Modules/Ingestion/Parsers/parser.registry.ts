import { UnsupportedDocumentTypeError } from "../Errors/document.errors"
import { CsvParser } from "./csv.parser"
import { DocxParser } from "./docx.parser"
import { HtmlParser } from "./html.parser"
import { JsonParser } from "./json.parser"
import { MarkdownParser } from "./markdown.parser"
import { PdfParser } from "./pdf.parser"
import { TextParser } from "./text.parser"
import type { Parser } from "./parser"

function normalizeMime(mimeType: string): string {
  return mimeType.split(";")[0]!.trim().toLowerCase()
}

/**
 * Parser registry / factory. New formats are added without touching the
 * ingestion pipeline:
 *
 *   parserRegistry.register(new DocxParser())
 */
export class ParserRegistry {
  private readonly parsers: Parser[] = []

  register(parser: Parser): this {
    this.parsers.push(parser)
    return this
  }

  get(mimeType: string): Parser {
    const normalized = normalizeMime(mimeType)
    const parser = this.parsers.find((p) => p.supports(normalized))
    if (!parser) {
      throw new UnsupportedDocumentTypeError(mimeType)
    }
    return parser
  }

  supportedMimeTypes(): string[] {
    // Representative MIME per parser (parsers match exactly these).
    const mimes: string[] = []
    const candidates = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/html",
      "text/plain",
      "text/csv",
      "text/markdown",
      "application/json",
    ]
    for (const mime of candidates) {
      if (this.parsers.some((p) => p.supports(mime))) mimes.push(mime)
    }
    return mimes
  }
}

/** Default registry: all formats RAGX ingests. New formats register here. */
export const parserRegistry = new ParserRegistry()
  .register(new PdfParser())
  .register(new TextParser())
  .register(new MarkdownParser())
  .register(new HtmlParser())
  .register(new CsvParser())
  .register(new DocxParser())
  .register(new JsonParser())
