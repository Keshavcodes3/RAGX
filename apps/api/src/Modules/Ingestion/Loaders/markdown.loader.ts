import fs from "node:fs/promises";
import path from "node:path";

export async function readMarkdown(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);

  const markdown = await fs.readFile(absolutePath, "utf-8");

  return markdown.trim();
}
