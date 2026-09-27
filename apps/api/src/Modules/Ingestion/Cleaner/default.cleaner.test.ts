import { describe, expect, it } from "bun:test"

import type {
  ParsedBlock,
  ParsedDocument,
} from "../Document/types"
import { toStructuredDocument } from "../Document/adapters"
import { DefaultCleaner } from "./default.cleaner"

function doc(blocksPerPage: ParsedBlock[][], title = "t"): ParsedDocument {
  return {
    pages: blocksPerPage.map((blocks, i) => ({
      pageNumber: i + 1,
      blocks,
    })),
    metadata: { title },
  }
}

const text = (content: string): ParsedBlock => ({ type: "text", content })
const heading = (content: string, level = 2): ParsedBlock => ({
  type: "header",
  level,
  content,
})

describe("DefaultCleaner", () => {
  const cleaner = new DefaultCleaner()

  it("collapses extra whitespace while keeping content", () => {
    const cleaned = cleaner.clean(doc([[text("   JWT    tokens   are   useful ")]]))
    expect(cleaned.pages[0]!.blocks).toEqual([
      { type: "text", content: "JWT tokens are useful" },
    ])
  })

  it("removes empty blocks and normalizes repeated blank lines", () => {
    const cleaned = cleaner.clean(
      doc([[text(""), text("   "), text("First\n\n\n\nSecond")]]),
    )
    const contents = cleaned.pages[0]!.blocks.map(
      (b) => (b as { content: string }).content,
    )
    expect(contents).toEqual(["First\nSecond"])
  })

  it("reflows wrapped prose lines and repairs hyphenated breaks", () => {
    const cleaned = cleaner.clean(
      doc([
        [
          text("JWT tokens\nare useful for authentication."),
          text("token-\nization keeps context intact."),
        ],
      ]),
    )
    const contents = cleaned.pages[0]!.blocks.map(
      (b) => (b as { content: string }).content,
    )
    expect(contents).toContain("JWT tokens are useful for authentication.")
    expect(contents).toContain("tokenization keeps context intact.")
  })

  it("does not blindly merge lines that end sentences", () => {
    const cleaned = cleaner.clean(
      doc([[text("First sentence ends here.\nSecond sentence starts now.")]]),
    )
    expect(cleaned.pages[0]!.blocks[0]).toEqual({
      type: "text",
      content: "First sentence ends here.\nSecond sentence starts now.",
    })
  })

  it("normalizes unicode (NFC, ligatures, nbsp, zero-width)", () => {
    const cleaned = cleaner.clean(
      doc([[text("ﬁle name​ok")]]),
    )
    expect(cleaned.pages[0]!.blocks[0]).toEqual({
      type: "text",
      content: "file nameok",
    })
    const decomposed = cleaner.clean(doc([[text("café")]]))
    expect(decomposed.pages[0]!.blocks[0]).toEqual({
      type: "text",
      content: "café",
    })
  })

  it("removes repeated headers across many pages", () => {
    const pages: ParsedBlock[][] = Array.from({ length: 4 }, (_, i) => [
      text("RAGX Documentation"),
      text(`Body content page ${i + 1} with enough words to be real.`),
    ])
    const cleaned = cleaner.clean(doc(pages))
    for (const page of cleaned.pages) {
      expect(page.blocks).toHaveLength(1)
      expect((page.blocks[0] as { content: string }).content).toContain(
        "Body content",
      )
    }
  })

  it("removes repeated footers from the last block position", () => {
    const pages: ParsedBlock[][] = Array.from({ length: 4 }, (_, i) => [
      text(`Unique body ${i + 1} that differs on every single page here.`),
      text("Page footer confidential"),
    ])
    const cleaned = cleaner.clean(doc(pages))
    for (const page of cleaned.pages) {
      expect(page.blocks).toHaveLength(1)
      expect((page.blocks[0] as { content: string }).content).toContain(
        "Unique body",
      )
    }
  })

  it("strips a repeated header sharing its block with body text", () => {
    const pages: ParsedBlock[][] = Array.from({ length: 4 }, (_, i) => [
      text(`RAGX Documentation\nBody content page ${i + 1} stays intact here.`),
    ])
    const cleaned = cleaner.clean(doc(pages))
    for (const page of cleaned.pages) {
      expect(page.blocks).toHaveLength(1)
      const content = (page.blocks[0] as { content: string }).content
      expect(content).not.toContain("RAGX Documentation")
      expect(content).toContain("stays intact")
    }
  })

  it("is conservative: keeps repeats on few pages, mid-page, or long text", () => {
    // Only 2 pages (< 3 minimum).
    const two = cleaner.clean(
      doc([
        [text("RAGX Documentation"), text("Body one here.")],
        [text("RAGX Documentation"), text("Body two here.")],
      ]),
    )
    expect(two.pages[0]!.blocks).toHaveLength(2)

    // Repeat in the middle of a page is not a header/footer, even when
    // page edges are unique.
    const mid = cleaner.clean(
      doc(
        Array.from({ length: 4 }, (_, i) => [
          text(`Unique opener ${i + 1} starts this page differently.`),
          text("RAGX Documentation"),
          text(`Unique closer ${i + 1} ends this page differently.`),
        ]),
      ),
    )
    for (const page of mid.pages) {
      expect(page.blocks).toHaveLength(3)
    }
    const longRepeat = "word ".repeat(40).trim()
    const long = cleaner.clean(
      doc(
        Array.from({ length: 4 }, (_, i) => [
          text(longRepeat),
          text(`Unique tail ${i}.`),
        ]),
      ),
    )
    expect(long.pages[0]!.blocks).toHaveLength(2)
  })

  it("preserves page numbers, block order and block types", () => {
    const cleaned = cleaner.clean(
      doc(
        [
          [
            heading("Intro", 1),
            text("  paragraph one  "),
            {
              type: "table",
              content: "| a |\n| --- |\n| 1 |",
              rows: [["a"], ["1"]],
            },
            { type: "image", name: "img-0", width: 10, height: 10 },
          ],
          [text("second page")],
        ],
        // Use distinct page numbers to prove they are untouched.
        "meta",
      ),
    )
    expect(cleaned.pages.map((p) => p.pageNumber)).toEqual([1, 2])
    expect(cleaned.pages[0]!.blocks.map((b) => b.type)).toEqual([
      "header",
      "text",
      "table",
      "image",
    ])
    expect(cleaned.pages[1]!.blocks.map((b) => b.type)).toEqual(["text"])
  })

  it("normalizes table cells and rebuilds markdown instead of dropping tables", () => {
    const cleaned = cleaner.clean(
      doc([
        [
          {
            type: "table",
            content: "stale markdown",
            rows: [
              ["  Name ", " Age "],
              [" Ada ", " 36 "],
              ["   ", ""],
            ],
          },
        ],
      ]),
    )
    const table = cleaned.pages[0]!.blocks[0] as {
      type: "table"
      content: string
      rows: string[][]
    }
    expect(table.type).toBe("table")
    expect(table.rows).toEqual([
      ["Name", "Age"],
      ["Ada", "36"],
    ])
    expect(table.content).toContain("| Name | Age |")
    expect(table.content).toContain("| Ada | 36 |")
  })

  it("keeps image blocks as structural information", () => {
    const image: ParsedBlock = {
      type: "image",
      content: "Image img-0 on page 1 (10x10)",
      name: "img-0",
      width: 10,
      height: 10,
    }
    const cleaned = cleaner.clean(doc([[text("caption"), image]]))
    expect(cleaned.pages[0]!.blocks).toContainEqual(image)
  })

  it("passes metadata through and rejects invalid input", () => {
    const cleaned = cleaner.clean(
      doc([[text("hi")]]),
    )
    expect(cleaned.metadata.title).toBe("t")
    expect(() =>
      cleaner.clean({ pages: "nope" } as unknown as ParsedDocument),
    ).toThrow()
  })

  it("projects onto StructuredDocument for the future chunker handoff", () => {
    const cleaned = cleaner.clean(
      doc([
        [
          heading("Intro", 1),
          text("body"),
          {
            type: "table",
            content: "| a |\n| --- |\n| 1 |",
            rows: [["a"], ["1"]],
          },
        ],
      ]),
    )
    const structured = toStructuredDocument(cleaned, "guide.pdf")
    expect(structured.fileName).toBe("guide.pdf")
    expect(structured.totalPages).toBe(1)
    expect(structured.pages[0]!.headers).toEqual([
      { level: 1, text: "Intro", pageNumber: 1 },
    ])
    expect(structured.tableCount).toBe(1)
    expect(structured.text).toContain("body")
  })
})
