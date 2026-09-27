import { fixedChunk } from "./fixed.size.chunking";
import { fixedTokenChunk } from "./fixed.token.chunking";
import { codeChunk } from "./code.aware.chunking";
import { markdownChunk } from "./markdown.based.chunking";
import { paragraphChunk } from "./paragraph.based.chunking";
import { recursiveChunk } from "./recursive.chunking";
import { semanticChunk } from "./semantic.chunking";
import { sentenceChunk } from "./sentence.based.chunking";
import { structuredChunk } from "./structured.chunking";

export const chunkRegistry = (strategy: string) => {
  switch (strategy) {
    case "fixed":
      return fixedChunk;

    case "fixed-token":
      return fixedTokenChunk;

    case "code":
      return codeChunk;

    case "markdown":
      return markdownChunk;

    case "paragraph":
      return paragraphChunk;

    case "recursive":
      return recursiveChunk;

    case "semantic":
      return semanticChunk;

    case "sentence":
      return sentenceChunk;

    case "structured":
      return structuredChunk;

    default:
      return semanticChunk;
  }
};
