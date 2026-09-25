export function paragraphChunk(
  text: string,
  maxCharacters: number = 2000,
): string[] {
  if (!text.trim()) {
    return [];
  }

  if (maxCharacters <= 0) {
    throw new Error("maxCharacters must be greater than 0");
  }

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const candidate = currentChunk
      ? `${currentChunk}\n\n${paragraph}`
      : paragraph;

    if (
      currentChunk &&
      candidate.length > maxCharacters
    ) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk = candidate;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
