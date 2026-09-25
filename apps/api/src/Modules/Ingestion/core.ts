import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

export async function readPdf(filePath: string) {

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const absolutePath = path.resolve(__dirname, filePath);

  console.log("Reading:", absolutePath);

  const fileBuffer = await fs.readFile(absolutePath);

  const parser = new PDFParse({
    data: fileBuffer,
  });

  const result = await parser.getText();

  console.log(result.text);

  await parser.destroy();

  return result.text;
}

const text = await readPdf("./go.pdf");
