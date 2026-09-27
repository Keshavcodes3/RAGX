// NOTE: single resolution point for chunking strategies.
//
// All strategy selection flows through `resolveChunker()`. The ingestion
// pipeline (`DocumentService.processDocument`) intentionally does NOT call
// this yet — RAGX chooses `structuredChunk` internally and never exposes
// strategy configuration to clients. The registry exists so future
// per-project configuration has one place to land instead of scattered
// if/else chains.
//
// WHY a typed map over a switch: the map makes the strategy→implementation
// pairing declarative and exhaustively checked by `Record<ChunkStrategyName,
// ...>`. `chunkRegistry()` in `index.ts` is preserved as a backwards-
// compatible alias (same silent semantic fallback).

import { codeChunk } from "./code.aware.chunking";
import { fixedChunk } from "./fixed.size.chunking";
import { fixedTokenChunk } from "./fixed.token.chunking";
import { markdownChunk } from "./markdown.based.chunking";
import { paragraphChunk } from "./paragraph.based.chunking";
import { recursiveChunk } from "./recursive.chunking";
import { semanticChunk } from "./semantic.chunking";
import { sentenceChunk } from "./sentence.based.chunking";
import { structuredChunk } from "./structured.chunking";
import type { ChunkStrategyName, TextChunker } from "./chunk.types";

export type { ChunkStrategyName } from "./chunk.types";
export { isChunkStrategyName } from "./chunk.types";

/**
 * Declarative strategy table. `semanticChunk` needs an embed callback, so
 * it is wrapped to satisfy the shared `TextChunker` shape; callers that
 * need semantic chunking pass the embed function explicitly.
 */
//? Should semanticChunk stay in this table given it requires an embed
// callback the other strategies don't need?
const chunkerMap: Record<ChunkStrategyName, TextChunker> = {
  // biome-ignore lint: heterogeneous chunker arities are intentional
  fixed: fixedChunk as unknown as TextChunker,
  "fixed-token": fixedTokenChunk as unknown as TextChunker,
  code: codeChunk as unknown as TextChunker,
  markdown: markdownChunk as unknown as TextChunker,
  paragraph: paragraphChunk as unknown as TextChunker,
  recursive: recursiveChunk as unknown as TextChunker,
  semantic: semanticChunk as unknown as TextChunker,
  sentence: sentenceChunk as unknown as TextChunker,
  structured: structuredChunk as unknown as TextChunker,
};

export const DEFAULT_CHUNK_STRATEGY: ChunkStrategyName = "semantic";

/**
 * Resolve a chunker by name. Unknown names fall back to semantic chunking
 * to preserve the historical `chunkRegistry()` contract.
 */
export function resolveChunker(strategy: string): TextChunker {
  const chunker = (chunkerMap as Record<string, TextChunker | undefined>)[strategy];
  return chunker ?? (semanticChunk as unknown as TextChunker);
}

/** Strict variant: throws on unknown strategy (for future config use). */
export function requireChunker(strategy: string): TextChunker {
  const chunker = (chunkerMap as Record<string, TextChunker | undefined>)[strategy];
  if (!chunker) {
    throw new Error(
      `Unknown chunking strategy: ${strategy}. Expected one of: ${Object.keys(chunkerMap).join(", ")}`,
    );
  }
  return chunker;
}

export function listChunkStrategies(): ChunkStrategyName[] {
  return Object.keys(chunkerMap) as ChunkStrategyName[];
}
