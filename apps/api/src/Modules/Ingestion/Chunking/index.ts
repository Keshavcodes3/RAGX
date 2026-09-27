// NOTE: backwards-compatible chunking barrel.
//
// `chunkRegistry()` is the historical entry point; `chunk.registry.ts` is
// the canonical typed registry going forward. Both stay exported so
// existing imports keep working while new code adopts
// `resolveChunker()` / `requireChunker()` / `ChunkStrategyName`.

import { fixedChunk } from "./fixed.size.chunking";
import { fixedTokenChunk } from "./fixed.token.chunking";
import { codeChunk } from "./code.aware.chunking";
import { markdownChunk } from "./markdown.based.chunking";
import { paragraphChunk } from "./paragraph.based.chunking";
import { recursiveChunk } from "./recursive.chunking";
import { semanticChunk } from "./semantic.chunking";
import { sentenceChunk } from "./sentence.based.chunking";
import { structuredChunk } from "./structured.chunking";
import { resolveChunker } from "./chunk.registry";

export const chunkRegistry = (strategy: string) => {
  return resolveChunker(strategy);
};

// Canonical registry (typed map). New code should import from here.
export {
  DEFAULT_CHUNK_STRATEGY,
  listChunkStrategies,
  requireChunker,
  resolveChunker,
} from "./chunk.registry";
export type { ChunkStrategyName, TextChunker } from "./chunk.types";
export { isChunkStrategyName } from "./chunk.types";

// Direct strategy access (preserved for existing imports/tests).
export {
  codeChunk,
  fixedChunk,
  fixedTokenChunk,
  markdownChunk,
  paragraphChunk,
  recursiveChunk,
  semanticChunk,
  sentenceChunk,
  structuredChunk,
};
