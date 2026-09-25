import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

export async function readCsv(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);

  const csv = await fs.readFile(absolutePath, "utf-8");

  const records = parse<Record<string, string>>(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records
    .map((row) =>
      Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n"),
    )
    .join("\n\n");
}
