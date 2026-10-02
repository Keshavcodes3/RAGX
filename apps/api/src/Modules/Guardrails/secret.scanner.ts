type SecretKind =
  | "api-key"
  | "private-key"
  | "jwt"
  | "bearer-token"
  | "connection-string"
  | "credential-assignment"
  | "known-secret";

interface SecretScanResult {
  hasSecrets: boolean;
  types: SecretKind[];
}

interface SecretScanOptions {
  /** Pass actual runtime credentials to detect keys without recognizable formats. */
  knownSecrets?: readonly string[];
}

const RULES: readonly { kind: SecretKind; pattern: RegExp }[] = [
  {
    kind: "api-key",
    pattern: /\b(?:ragx_live_[A-Za-z0-9]{32}|AIza[A-Za-z0-9_-]{35}|sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}|(?:AKIA|ASIA)[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  },
  {
    kind: "private-key",
    // Flag the header even when the leaked key is truncated.
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
  },
  {
    kind: "jwt",
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
  },
  {
    kind: "bearer-token",
    pattern: /\bBearer[ \t]+[A-Za-z0-9._~+\/-]{8,}=*/i,
  },
  {
    kind: "connection-string",
    pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis(?:s)?|amqp(?:s)?):\/\/[^\s/@:]+:[^\s/@]+@[^\s"'<>`]+/i,
  },
];

// Detect labeled credentials, including JSON, .env, and common code examples.
const ASSIGNMENT = /["']?\b(?:[A-Za-z0-9]+[_-])*(?:api[_-]?key|secret(?:[_-]?key)?|encryption[_-]?key|password|passwd|pwd|(?:access[_-]|refresh[_-]|auth[_-])?token|client[_-]?secret|credentials?)["']?[ \t]*[:=][ \t]*(?:"([^"\r\n]+)"|'([^'\r\n]+)'|(\$\{[^}\r\n]*\}|\[REDACTED\]|[^\s,;\]}]+))/gi;

function isPlaceholder(value: string): boolean {
  return /^(?:<[^>]*>|\$\{[^}]*\}|\*+|\.+|\[REDACTED\]|redacted|undefined|null|true|false|(?:your|example|sample|dummy|test|fake|placeholder)(?:[_ -].*)?|change[-_ ]?me(?:[-_ ].*)?)$/i.test(value);
}

function hasCredentialAssignment(output: string): boolean {
  for (const match of output.matchAll(ASSIGNMENT)) {
    const value = match[1] ?? match[2] ?? match[3];
    if (value && !isPlaceholder(value)) return true;
  }
  return false;
}

/**
 * Local, synchronous heuristic scan. Does not call an AI provider or log output.
 * A clean result is not a guarantee: unknown or encoded secrets may be missed.
 * Returns unique detected types without secret values or positions.
 */
export function scanSecrets(
  output: string,
  options: SecretScanOptions = {},
): SecretScanResult {
  const types: SecretKind[] = [];

  for (const { kind, pattern } of RULES) {
    if (pattern.test(output)) types.push(kind);
  }

  if (hasCredentialAssignment(output)) {
    types.push("credential-assignment");
  }

  const knownSecrets = options.knownSecrets ?? [];
  if (knownSecrets.some(secret => secret.trim() !== "" && output.includes(secret))) {
    types.push("known-secret");
  }

  return { hasSecrets: types.length > 0, types };
}
