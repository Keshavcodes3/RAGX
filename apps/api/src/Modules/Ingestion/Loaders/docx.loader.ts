import path from "node:path";
import mammoth from "mammoth";

export async function readDocx(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);

  const result = await mammoth.extractRawText({
    path: absolutePath,
  });

  return result.value.trim();
}
