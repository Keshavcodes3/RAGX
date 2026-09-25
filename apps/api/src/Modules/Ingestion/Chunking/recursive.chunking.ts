import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function recursiveChunk(
  text: string,
  chunkSize: number = 1000,
  chunkOverlap: number = 200,
): Promise<string[]> {
  if (!text.trim()) {
    return [];
  }

  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }

  if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
    throw new Error(
      "chunkOverlap must be less than chunkSize",
    );
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  return splitter.splitText(text);
}
