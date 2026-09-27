/**
 * Minimal valid PDF 1.4 builder for tests. Emits real PDF bytes (correct
 * xref table) so parser tests exercise the actual pdf-parse extraction
 * path instead of mocks.
 */
export interface TestPdfInfo {
  title?: string
  author?: string
  subject?: string
}

function escapePdfString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
}

export function buildTestPdf(
  pages: string[][],
  info?: TestPdfInfo,
): Buffer {
  const objects: string[] = []
  const pageCount = pages.length

  // Object numbering: 1 catalog, 2 pages, 3 font, then 2 per page.
  const pageObjNums: number[] = []
  const contentObjNums: number[] = []
  for (let i = 0; i < pageCount; i++) {
    pageObjNums.push(4 + i * 2)
    contentObjNums.push(5 + i * 2)
  }
  const infoObjNum = 4 + pageCount * 2

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>"
  objects[2] =
    `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageCount} >>`
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"

  for (let i = 0; i < pageCount; i++) {
    const lines = pages[i] ?? []
    const textOps =
      lines.length === 0
        ? ""
        : "BT /F1 12 Tf 72 750 Td 14 TL " +
          lines.map((line) => `(${escapePdfString(line)})'`).join(" ") +
          " ET"
    const stream = `${textOps}`
    const streamLength = Buffer.byteLength(stream, "latin1")
    objects[pageObjNums[i]!] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjNums[i]!} 0 R >>`
    objects[contentObjNums[i]!] =
      `<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`
  }

  let maxObj = 3 + pageCount * 2
  if (info) {
    const parts: string[] = []
    if (info.title) parts.push(`/Title (${escapePdfString(info.title)})`)
    if (info.author) parts.push(`/Author (${escapePdfString(info.author)})`)
    if (info.subject) parts.push(`/Subject (${escapePdfString(info.subject)})`)
    objects[infoObjNum] = `<< ${parts.join(" ")} >>`
    maxObj = infoObjNum
  }

  let pdf = "%PDF-1.4\n"
  const offsets: number[] = [0]
  for (let n = 1; n <= maxObj; n++) {
    offsets[n] = Buffer.byteLength(pdf, "latin1")
    pdf += `${n} 0 obj\n${objects[n] ?? ""}\nendobj\n`
  }
  const xrefOffset = Buffer.byteLength(pdf, "latin1")
  pdf += `xref\n0 ${maxObj + 1}\n`
  pdf += "0000000000 65535 f \n"
  for (let n = 1; n <= maxObj; n++) {
    pdf += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R${info ? ` /Info ${infoObjNum} 0 R` : ""} >>\n`
  pdf += `startxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, "latin1")
}
