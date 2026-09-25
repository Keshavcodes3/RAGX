import fs from "node:fs/promises";
import path from "node:path";

export async function readTxt(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);

  const text = await fs.readFile(absolutePath, "utf-8");

  return text.trim();
}
