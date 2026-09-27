import { describe, expect, it } from "bun:test";

import { generateApiKey, hashApiKey } from "./generateApiKey";

describe("generateApiKey", () => {
  it("generates keys with the recognizable ragx_ prefix", () => {
    expect(generateApiKey().startsWith("ragx_live_")).toBe(true);
  });

  it("generates unique keys from secure randomness", () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateApiKey()));
    expect(keys.size).toBe(100);
  });

  it("stores only a sha256 hash that cannot reveal the key", () => {
    const key = generateApiKey();
    const hash = hashApiKey(key);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(key);
    expect(hashApiKey(key)).toBe(hash);
  });
});
