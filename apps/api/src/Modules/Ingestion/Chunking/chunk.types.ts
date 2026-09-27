// NOTE: chunking strategy contract.
//
// Every chunker stays an independent module (fixed / semantic / structured
// / ...). This file owns only the shared vocabulary so the registry — and
// future pipeline wiring — can resolve strategies without scattered
// if/else chains or untyped string switches.
//
// WHY: chunkers have heterogeneous signatures today (sync text→text[] vs
// async embedding-aware vs structured-document→structured-chunks). The
// union below documents that reality instead of pretending they are
// interchangeable, while `ChunkStrategyName` gives the registry a closed,
// validated set of names.

/** Closed set of chunking strategies resolvable through the registry. */
export type ChunkStrategyName =
  | "fixed"
  | "fixed-token"
  | "code"
  | "markdown"
  | "paragraph"
  | "recursive"
  | "semantic"
  | "sentence"
  | "structured";

/** Sync text → text[] chunkers (fixed, sentence, paragraph, markdown...). */
export type SyncTextChunker = (text: string, ...args: never[]) => string[];

/** Async text → text[] chunkers (recursive, code-aware...). */
export type AsyncTextChunker = (text: string, ...args: never[]) => Promise<string[]>;

/**
 * Any text chunker, sync or async. Callers normalize with `await`
 * so sync chunkers work transparently in async pipelines.
 */
export type TextChunker = (...args: never[]) => string[] | Promise<string[]>;

/** Runtime guard for strategy names coming from config / requests. */
export function isChunkStrategyName(value: unknown): value is ChunkStrategyName {
  return (
    typeof value === "string" &&
    (
      [
        "fixed",
        "fixed-token",
        "code",
        "markdown",
        "paragraph",
        "recursive",
        "semantic",
        "sentence",
        "structured",
      ] as const
    ).includes(value as ChunkStrategyName)
  );
}
