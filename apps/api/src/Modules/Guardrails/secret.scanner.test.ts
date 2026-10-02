import { describe, expect, it } from "bun:test";
import { scanSecrets } from "./secret.scanner";

describe("secret scanner", () => {
  it("detects recognizable provider and RAGX keys in prose", () => {
    for (const key of [
      `ragx_live_${"A".repeat(32)}`,
      `AIza${"a".repeat(35)}`,
      `sk-proj-${"a".repeat(40)}`,
      `AKIA${"A".repeat(16)}`,
      `ghp_${"a".repeat(36)}`,
    ]) {
      expect(scanSecrets(`Here is ${key}.`).types).toContain("api-key");
    }
  });

  it("detects credentials in JSON, env variables, and assignments", () => {
    for (const output of [
      '{"apiKey": "opaqueCredential123"}',
      "GEMINI_GUARD_API_KEY=opaqueCredential123",
      "RAGX_ENCRYPTION_KEY=" + "a".repeat(64),
      "password = 'short'",
      "client_secret: opaqueCredential123",
    ]) expect(scanSecrets(output).hasSecrets).toBe(true);
  });

  it("detects authentication tokens, credential URLs, and truncated private keys", () => {
    for (const output of [
      "Authorization: Bearer abcdefgh12345678",
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
      "postgresql://user:p%40ss@localhost:5432/ragx",
      "mongodb+srv://user:pass@cluster.example/db",
      "-----BEGIN RSA PRIVATE KEY-----",
    ]) expect(scanSecrets(output).hasSecrets).toBe(true);
  });

  it("allows ordinary answers and placeholder documentation", () => {
    for (const output of [
      "", "The answer is 42.", "The API key should stay on the server.",
      'API_KEY="your_api_key_here"', "password=<password>",
      "JWT_SECRET=change-me-in-production", "token=[REDACTED]",
      "API_KEY=${API_KEY}", "postgresql://localhost:5432/ragx",
    ]) expect(scanSecrets(output).hasSecrets).toBe(false);
  });

  it("reports literal runtime secrets once without exposing their values", () => {
    const secret = "opaque+credential.with[symbols]";
    const output = `First ${secret}; second ${secret}`;
    const result = scanSecrets(output, { knownSecrets: [secret, secret, "", " "] });
    expect(result.hasSecrets).toBe(true);
    expect(result.types).toEqual(["known-secret"]);
    expect(Object.keys(result).sort()).toEqual(["hasSecrets", "types"]);
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it("reports multiple credential types without duplicate categories", () => {
    const key = `ragx_live_${"A".repeat(32)}`;
    const result = scanSecrets(`${key} ${key}\npassword='secret123'\n-----BEGIN PRIVATE KEY-----`);
    expect(result).toEqual({
      hasSecrets: true,
      types: ["api-key", "private-key", "credential-assignment"],
    });
    expect(scanSecrets("Safe answer")).toEqual({ hasSecrets: false, types: [] });
  });

  it("returns consistent results across repeated scans", () => {
    const output = `ragx_live_${"A".repeat(32)}`;
    expect(scanSecrets(output)).toEqual(scanSecrets(output));
    expect(scanSecrets("Safe answer").hasSecrets).toBe(false);
  });
});
