/** Shared table helpers used by parsers (rows → markdown) and the cleaner
 * (rebuild markdown after cell normalization) so both stages stay consistent.
 */

export function tableToMarkdown(rows: string[][]): string {
  if (rows.length === 0) return ""
  const escape = (cell: string) =>
    cell.replace(/\|/g, "\\|").replace(/\n/g, " ").trim()
  const header = rows[0]!.map(escape)
  const separator = header.map(() => "---")
  const lines = [`| ${header.join(" | ")} |`, `| ${separator.join(" | ")} |`]
  for (const row of rows.slice(1)) {
    const cells = header.map((_, i) => escape(row[i] ?? ""))
    lines.push(`| ${cells.join(" | ")} |`)
  }
  return lines.join("\n")
}
