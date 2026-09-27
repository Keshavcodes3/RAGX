/**
 * Minimal ambient types for Node/Bun globals the SDK uses.
 * Both runtimes provide these; this only satisfies `tsc --noEmit`
 * without adding @types/node.
 */
declare module "node:fs/promises" {
  export function readFile(path: string): Promise<Buffer>;
}

declare module "node:path" {
  export function basename(p: string): string;
}

interface Buffer extends Uint8Array {
  toString(encoding?: string): string;
}

declare var Buffer: {
  from(data: Uint8Array | string, encoding?: string): Buffer;
};
