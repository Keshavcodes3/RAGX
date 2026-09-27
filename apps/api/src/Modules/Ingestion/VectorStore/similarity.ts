// NOTE: single cosine-similarity implementation for the API.
//
// Previously duplicated in `RetrievalService` and `semantic.chunking.ts`
// with subtly different zero-vector guards. Both call sites now import
// from here so ranking semantics cannot drift between retrieval and
// semantic chunking.

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
