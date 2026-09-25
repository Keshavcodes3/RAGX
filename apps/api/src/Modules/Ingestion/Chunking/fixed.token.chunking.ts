import { encoding_for_model } from "tiktoken";

export function fixedTokenChunk(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100,
): string[] {
  if (!text.trim()) {
    return [];
  }

  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }

  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error(
      "overlap must be greater than or equal to 0 and less than chunkSize",
    );
  }

  const encoding = encoding_for_model("gpt-4o");

  try {
    const tokens = encoding.encode(text);
    const chunks: string[] = [];
    const step = chunkSize - overlap;

    for (let start = 0; start < tokens.length; start += step) {
      const chunkTokens = tokens.slice(start, start + chunkSize);
    //@ts-ignore
      const chunk = encoding.decode(chunkTokens).trim();

      if (chunk) {
        chunks.push(chunk);
      }
    }

    return chunks;
  } finally {
    encoding.free();
  }
}
