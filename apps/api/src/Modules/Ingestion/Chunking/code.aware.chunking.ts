import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

type CodeLanguage =
  | "cpp"
  | "go"
  | "java"
  | "javascript"
  | "typescript"
  | "python"
  | "rust"
  | "c"
  | "csharp"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin"
  | "scala";

export async function codeChunk(
  text: string,
  language: CodeLanguage,
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
  const splitter =
  //@ts-ignore
    RecursiveCharacterTextSplitter.fromLanguage(language, {
      chunkSize,
      chunkOverlap,
    });

  return splitter.splitText(text);
}
