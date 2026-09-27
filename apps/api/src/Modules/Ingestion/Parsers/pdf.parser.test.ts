import { describe, expect, it } from "bun:test"

import {
  DocumentEmptyError,
  DocumentParseError,
} from "../Errors/document.errors"
import { PdfParser } from "./pdf.parser"
import { buildTestPdf } from "./pdf.test.utils"

describe("PdfParser", () => {
  const parser = new PdfParser()

  it("supports application/pdf (including parameters) and nothing else", () => {
    expect(parser.supports("application/pdf")).toBe(true)
    expect(parser.supports("Application/PDF; charset=binary")).toBe(true)
    expect(parser.supports("text/plain")).toBe(false)
    expect(parser.supports("text/html")).toBe(false)
  })

  it("parses a normal single-page PDF into text blocks", async () => {
    const data = buildTestPdf([
      ["Getting Started", "JWT tokens are useful for authentication."],
    ])
    const doc = await parser.parse({ data, fileName: "guide.pdf" })

    expect(doc.pages).toHaveLength(1)
    expect(doc.pages[0]!.pageNumber).toBe(1)
    const texts = doc.pages[0]!.blocks.filter((b) => b.type === "text")
    expect(texts.length).toBeGreaterThan(0)
    expect(texts.map((b) => (b as { content: string }).content).join(" "))
      .toContain("JWT tokens are useful")
  })

  it("preserves page boundaries on multi-page PDFs (no giant string)", async () => {
    const data = buildTestPdf([
      ["First page content alpha"],
      ["Second page content beta"],
      ["Third page content gamma"],
    ])
    const doc = await parser.parse({ data })

    expect(doc.pages).toHaveLength(3)
    expect(doc.pages.map((p) => p.pageNumber)).toEqual([1, 2, 3])
    expect(doc.pages[0]!.blocks.map((b) => (b as { content?: string }).content).join(" "))
      .toContain("alpha")
    expect(doc.pages[1]!.blocks.map((b) => (b as { content?: string }).content).join(" "))
      .toContain("beta")
    expect(doc.pages[2]!.blocks.map((b) => (b as { content?: string }).content).join(" "))
      .toContain("gamma")
  })

  it("extracts document metadata when present", async () => {
    const data = buildTestPdf([["Hello"]], {
      title: "RAGX Guide",
      author: "RAGX Team",
      subject: "Retrieval",
    })
    const doc = await parser.parse({ data })

    expect(doc.metadata.title).toBe("RAGX Guide")
    expect(doc.metadata.author).toBe("RAGX Team")
    expect(doc.metadata.subject).toBe("Retrieval")
  })

  it("tolerates PDFs without metadata", async () => {
    const data = buildTestPdf([["Hello"]])
    const doc = await parser.parse({ data })
    expect(doc.metadata).toEqual({})
  })

  it("rejects empty input", async () => {
    await expect(parser.parse({ data: Buffer.alloc(0) })).rejects.toBeInstanceOf(
      DocumentEmptyError,
    )
  })

  it("rejects corrupt PDFs with a meaningful error", async () => {
    const data = Buffer.from("this is not a pdf at all", "utf-8")
    await expect(parser.parse({ data })).rejects.toBeInstanceOf(
      DocumentParseError,
    )
  })

  it("rejects PDFs with no extractable content", async () => {
    const data = buildTestPdf([[]])
    await expect(parser.parse({ data })).rejects.toBeInstanceOf(
      DocumentEmptyError,
    )
  })
})
