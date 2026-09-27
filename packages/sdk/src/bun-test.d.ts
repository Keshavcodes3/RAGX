/**
 * Minimal test-runner types for `bun test` (the SDK runs its tests with
 * Bun; this keeps `tsc --noEmit` strict without adding dependencies).
 */
declare module "bun:test" {
  export type TestFn = (
    name: string,
    fn: () => void | Promise<void>,
  ) => void;
  export const describe: TestFn;
  export const it: TestFn;
  export const test: TestFn;
  export interface Matchers {
    not: Matchers;
    rejects: Matchers;
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toMatchObject(expected: unknown): void;
    toContain(expected: unknown): void;
    toHaveLength(expected: number): void;
    toThrow(expected?: string | RegExp): void;
    toThrowError(expected?: string | RegExp): void;
    toBeInstanceOf(expected: unknown): void;
    toBeDefined(): void;
  }
  export function expect(received: unknown): Matchers;
}
