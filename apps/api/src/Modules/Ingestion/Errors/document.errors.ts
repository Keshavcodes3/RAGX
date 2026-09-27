import { HttpError } from "@/Utils/httpError"

/** MIME type has no registered parser (e.g. audio, video, archives). */
export class UnsupportedDocumentTypeError extends HttpError {
  constructor(mimeType: string) {
    super(415, `Unsupported document type: ${mimeType}`)
  }
}

/** The file could not be parsed (corrupt file, parser failure). */
export class DocumentParseError extends HttpError {
  constructor(message = "Failed to parse document", options?: { cause?: unknown }) {
    super(422, message)
    if (options?.cause !== undefined) {
      // Kept as `cause` for server-side logs; controllers only send `message`.
      this.cause = options.cause
    }
  }
}

/** The file parsed but contained no usable content. */
export class DocumentEmptyError extends HttpError {
  constructor(message = "Document contains no extractable content") {
    super(422, message)
  }
}

/** The normalized document could not be cleaned. */
export class DocumentCleaningError extends HttpError {
  constructor(message = "Failed to clean document", options?: { cause?: unknown }) {
    super(500, message)
    if (options?.cause !== undefined) {
      this.cause = options.cause
    }
  }
}

/** The file could not be loaded (unreadable path, storage failure). */
export class DocumentLoadError extends HttpError {
  constructor(message = "Failed to load document", options?: { cause?: unknown }) {
    super(500, message)
    if (options?.cause !== undefined) {
      this.cause = options.cause
    }
  }
}
