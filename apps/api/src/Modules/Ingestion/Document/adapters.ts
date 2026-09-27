import type {
  CleanDocument,
  StructuredDocument,
  StructuredPage,
} from "./types"

/**
 * Compatibility shim: project a CleanDocument onto the pre-existing
 * StructuredDocument shape consumed by the current chunkers.
 *
 * The pipeline itself stops at CleanDocument; this only makes the cleaner
 * output immediately usable by the next stage when it is implemented.
 */
export function toStructuredDocument(
  document: CleanDocument,
  fileName: string,
): StructuredDocument {
  const pages: StructuredPage[] = document.pages.map((page) => {
    const textParts: string[] = []
    const markdownParts: string[] = []
    const headers: StructuredPage["headers"] = []
    const tables: StructuredPage["tables"] = []
    const images: StructuredPage["images"] = []

    for (const block of page.blocks) {
      switch (block.type) {
        case "header":
          headers.push({
            level: block.level,
            text: block.content,
            pageNumber: page.pageNumber,
          })
          textParts.push(block.content)
          markdownParts.push(`${"#".repeat(block.level)} ${block.content}`)
          break
        case "text":
          textParts.push(block.content)
          markdownParts.push(block.content)
          break
        case "table":
          tables.push({
            pageNumber: page.pageNumber,
            index: tables.length,
            rows: block.rows,
            markdown: block.content,
          })
          if (block.content) markdownParts.push(block.content)
          break
        case "image":
          images.push({
            pageNumber: page.pageNumber,
            index: images.length,
            name: block.name ?? `image-p${page.pageNumber}-${images.length}`,
            width: block.width ?? 0,
            height: block.height ?? 0,
            kind: block.kind ?? "unknown",
          })
          break
      }
    }

    return {
      pageNumber: page.pageNumber,
      text: textParts.join("\n\n"),
      headers,
      tables,
      images,
      markdown: markdownParts.join("\n\n"),
    }
  })

  const text = pages.map((p) => p.text).filter(Boolean).join("\n\n")
  const markdown = pages
    .map((p) => `<!-- page ${p.pageNumber} -->\n${p.markdown}`)
    .join("\n\n")

  return {
    fileName,
    totalPages: pages.length,
    pages,
    markdown,
    text,
    headers: pages.flatMap((p) => p.headers),
    tableCount: pages.reduce((n, p) => n + p.tables.length, 0),
    imageCount: pages.reduce((n, p) => n + p.images.length, 0),
  }
}
