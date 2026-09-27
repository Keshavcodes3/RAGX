import { describe, expect, it } from "bun:test";

import { decryptSecret, encryptSecret } from "./encryption";

const TEST_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("encryption", () => {
  it("round-trips a secret with AES-256-GCM", () => {
    process.env.RAGX_ENCRYPTION_KEY = TEST_KEY;

    const payload = encryptSecret("sk-test-secret-value");
    expect(payload).not.toContain("sk-test-secret-value");
    expect(payload.startsWith("v1.")).toBe(true);
    expect(decryptSecret(payload)).toBe("sk-test-secret-value");
  });

  it("produces unique ciphertexts for the same plaintext (random IV)", () => {
    process.env.RAGX_ENCRYPTION_KEY = TEST_KEY;

    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("rejects tampered payloads (auth tag mismatch)", () => {
    process.env.RAGX_ENCRYPTION_KEY = TEST_KEY;

    const payload = encryptSecret("sk-test-secret-value");
    const tampered = payload.slice(0, -2) + (payload.endsWith("AA") ? "BB" : "AA");

    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("rejects decryption with the wrong key", () => {
    process.env.RAGX_ENCRYPTION_KEY = TEST_KEY;
    const payload = encryptSecret("sk-test-secret-value");

    process.env.RAGX_ENCRYPTION_KEY =
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    expect(() => decryptSecret(payload)).toThrow();
  });

  it("rejects malformed payloads", () => {
    process.env.RAGX_ENCRYPTION_KEY = TEST_KEY;

    expect(() => decryptSecret("not-a-payload")).toThrow();
    expect(() => decryptSecret("")).toThrow();
  });

  it("refuses to encrypt empty secrets and to run without a key", () => {
    process.env.RAGX_ENCRYPTION_KEY = TEST_KEY;
    expect(() => encryptSecret("")).toThrow();

    delete process.env.RAGX_ENCRYPTION_KEY;
    expect(() => encryptSecret("sk-x")).toThrow(/RAGX_ENCRYPTION_KEY/);

    process.env.RAGX_ENCRYPTION_KEY = TEST_KEY;
  });

  it("never logs secrets", () => {
    process.env.RAGX_ENCRYPTION_KEY = TEST_KEY;
    const calls: unknown[][] = [];
    const methods = ["log", "info", "warn", "error", "debug"] as const;
    const originals = methods.map((m) => console[m]);

    methods.forEach((m) => {
      console[m] = (...args: unknown[]) => {
        calls.push(args);
      };
    });

    try {
      const payload = encryptSecret("sk-super-secret-123");
      decryptSecret(payload);
    } finally {
      methods.forEach((m, i) => {
        console[m] = originals[i]!;
      });
    }

    const logged = JSON.stringify(calls);
    expect(logged).not.toContain("sk-super-secret-123");
  });
});
