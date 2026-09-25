
import crypto from "node:crypto";

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

const KEY_BYTES = 32;


export function generateApiKey(): string {
  const bytes = crypto.randomBytes(KEY_BYTES);

  let secret = "";

  for (const byte of bytes) {
    secret += ALPHABET[byte % ALPHABET.length];
  }

  return `ragx_live_${secret}`;
}


export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");
}
