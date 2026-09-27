import { cosineSimilarity } from "../VectorStore/similarity";

// NOTE: cosine + sentence splitting are shared concepts — `cosineSimilarity`
// is imported from the VectorStore module so retrieval ranking and semantic
// chunking can never drift apart.

function splitSentences(text: string): string[] {
  return (
    text
      .replace(/\s+/g, " ")
      .trim()
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? []
  );
}


export async function semanticChunk(
  text: string,
  embed: (texts: string[]) => Promise<number[][]>,
  similarityThreshold: number = 0.75,
): Promise<string[]> {
  if (!text.trim()) {
    return [];
  }

  const sentences = splitSentences(text);

  if (sentences.length <= 1) {
    return sentences;
  }

  const embeddings = await embed(sentences);

  if (embeddings.length !== sentences.length) {
    throw new Error(
      "Embedding count does not match sentence count",
    );
  }

  const firstSentence = sentences[0];
  const firstEmbedding = embeddings[0];

  if (!firstSentence || !firstEmbedding) {
    return [];
  }

  const chunks: string[] = [];
  let currentChunk: string[] = [firstSentence];

  for (let i = 1; i < sentences.length; i++) {
    const previousEmbedding = embeddings[i - 1];
    const currentEmbedding = embeddings[i];
    const currentSentence = sentences[i];

    if (!previousEmbedding || !currentEmbedding || !currentSentence) {
      continue;
    }

    const similarity = cosineSimilarity(
      previousEmbedding,
      currentEmbedding,
    );

    if (similarity < similarityThreshold) {
      chunks.push(currentChunk.join(" "));
      currentChunk = [currentSentence];
    } else {
      currentChunk.push(currentSentence);
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}
