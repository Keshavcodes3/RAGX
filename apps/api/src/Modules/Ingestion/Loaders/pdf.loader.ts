import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

export async function readPdf(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);

  const fileBuffer = await fs.readFile(absolutePath);

  const parser = new PDFParse({
    data: fileBuffer,
  });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}
