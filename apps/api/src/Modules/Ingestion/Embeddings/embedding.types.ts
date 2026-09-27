/**
 * Minimal embedding contract: text in, vectors out.
 * The API key is bound at construction by RAGX and never appears
 * in calls, logs, or responses.
 */
export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
}
