import { describe, expect, it } from "bun:test"

import { DefaultCleaner } from "../Cleaner"
import type { Cleaner } from "../Cleaner"
import type { CleanDocument, ParsedDocument } from "../Document/types"
import {
  DocumentEmptyError,
  UnsupportedDocumentTypeError,
} from "../Errors/document.errors"
import { ParserRegistry, parserRegistry } from "../Parsers"
import type { Parser } from "../Parsers"
import { buildTestPdf } from "../Parsers/pdf.test.utils"
import { ingestDocument, ingestFile } from "./ingestion"

const silentLogger = { info: () => undefined }

describe("ingestion pipeline", () => {
  it("runs Upload → Parse → Clean and stops at CleanDocument", async () => {
    const data = buildTestPdf([
      ["RAGX Documentation", "JWT tokens are useful for auth."],
      ["RAGX Documentation", "Second page body text here."],
      ["RAGX Documentation", "Third page body text here."],
    ])
    const result = await ingestDocument(
      { data, fileName: "guide.pdf", documentId: "doc_1" },
      {},
      silentLogger,
    )

    expect(result.parsed.pages).toHaveLength(3)
    expect(result.cleaned.pages).toHaveLength(3)
    expect(result.cleaned.pages.map((p) => p.pageNumber)).toEqual([1, 2, 3])
    // Repeated header confidently removed by the cleaner.
    for (const page of result.cleaned.pages) {
      const contents = page.blocks.map(
        (b) => (b as { content?: string }).content ?? "",
      )
      expect(contents.join(" ")).not.toContain("RAGX Documentation")
    }
    expect(result.stats.documentId).toBe("doc_1")
    expect(result.stats.mimeType).toBe("application/pdf")
    expect(result.stats.parser).toBe("pdf")
    expect(result.stats.cleaner).toBe("default")
    expect(result.stats.pageCount).toBe(3)
    expect(result.stats.blockCount).toBeGreaterThan(0)
    expect(result.stats.durationMs).toBeGreaterThanOrEqual(0)
  })

  it("rejects unsupported MIME types without touching parser/cleaner", async () => {
    const data = Buffer.from("hello", "utf-8")
    await expect(
      ingestDocument(
        { data, fileName: "clip.mp4", mimeType: "video/mp4" },
        {},
        silentLogger,
      ),
    ).rejects.toBeInstanceOf(UnsupportedDocumentTypeError)
  })

  it("rejects empty input", async () => {
    await expect(
      ingestDocument({ data: Buffer.alloc(0), fileName: "empty.pdf" }, {}, silentLogger),
    ).rejects.toBeInstanceOf(DocumentEmptyError)
  })

  it("is extensible: a new parser plugs in without pipeline changes", async () => {
    const txtParser: Parser = {
      name: "txt",
      supports: (mime) => mime === "text/plain",
      parse: async (input) => ({
        pages: [
          {
            pageNumber: 1,
            blocks: [{ type: "text", content: Buffer.from(input.data).toString("utf-8") }],
          },
        ],
        metadata: {},
      }),
    }
    const registry = new ParserRegistry().register(txtParser)
    const result = await ingestDocument(
      { data: Buffer.from("   hello   world  "), fileName: "note.txt" },
      { registry },
      silentLogger,
    )
    expect(result.stats.parser).toBe("txt")
    expect(result.cleaned.pages[0]!.blocks).toEqual([
      { type: "text", content: "hello world" },
    ])
  })

  it("uses the injected cleaner", async () => {
    const passthrough: Cleaner = {
      name: "passthrough",
      clean: (document: ParsedDocument): CleanDocument => ({
        pages: document.pages.map((p) => ({
          pageNumber: p.pageNumber,
          blocks: [...p.blocks],
        })),
        metadata: { ...document.metadata },
      }),
    }
    const data = buildTestPdf([["Some body text here."]])
    const result = await ingestDocument(
      { data, fileName: "doc.pdf" },
      { registry: parserRegistry, cleaner: passthrough },
      silentLogger,
    )
    expect(result.stats.cleaner).toBe("passthrough")
  })

  it("ingestFile loads bytes with Bun and detects MIME from extension", async () => {
    const tmp = `./ingestion-test-${Date.now()}.pdf`
    await Bun.write(tmp, buildTestPdf([["File based body text."]]))
    try {
      const result = await ingestFile(tmp, {}, silentLogger, {
        documentId: "doc_file",
      })
      expect(result.stats.documentId).toBe("doc_file")
      expect(result.stats.mimeType).toBe("application/pdf")
      expect(result.cleaned.pages).toHaveLength(1)
    } finally {
      const { unlink } = await import("node:fs/promises")
      await unlink(tmp).catch(() => undefined)
    }
  })

  it("ingestFile reports missing files meaningfully", async () => {
    await expect(
      ingestFile("./does-not-exist-ragx.pdf", {}, silentLogger),
    ).rejects.toThrowError(/not found/i)
  })

  it("logs only stats metadata, never document contents", async () => {
    const seen: Record<string, unknown>[] = []
    const data = buildTestPdf([["Secret body content here."]])
    await ingestDocument(
      { data, fileName: "secret.pdf" },
      { cleaner: new DefaultCleaner() },
      { info: (_msg, fields) => seen.push(fields) },
    )
    const logged = JSON.stringify(seen)
    expect(logged).not.toContain("Secret body content")
    expect(seen[0]).toMatchObject({
      mimeType: "application/pdf",
      parser: "pdf",
      pageCount: 1,
    })
  })
})
