export function sentenceChunk(
  text: string,
  maxCharacters: number = 1000,
): string[] {
  if (!text.trim()) {
    return [];
  }

  if (maxCharacters <= 0) {
    throw new Error("maxCharacters must be greater than 0");
  }

  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g);

  if (!sentences) {
    return [];
  }

  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();

    if (!cleanSentence) {
      continue;
    }

    const candidate = currentChunk
      ? `${currentChunk} ${cleanSentence}`
      : cleanSentence;

    if (
      currentChunk &&
      candidate.length > maxCharacters
    ) {
      chunks.push(currentChunk);
      currentChunk = cleanSentence;
    } else {
      currentChunk = candidate;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
