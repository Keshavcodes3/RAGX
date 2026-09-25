export function fixedChunk(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200,
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

  const chunks: string[] = [];
  const step = chunkSize - overlap;

  for (let start = 0; start < text.length; start += step) {
    const chunk = text.slice(start, start + chunkSize).trim();

    if (chunk) {
      chunks.push(chunk);
    }
  }

  return chunks;
}
