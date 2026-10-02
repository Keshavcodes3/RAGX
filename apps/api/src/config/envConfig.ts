// NOTE: Centralized environment/configuration layer.
//
// All server code must read configuration from `envConfig` — never from
// `process.env` directly (except this module and `drizzle.config.ts`, which
// runs outside the app lifecycle). This keeps required-variable validation,
// insecure-default warnings, and secret handling in exactly one place.
//
// WHY: scattered `process.env.X` reads make missing-variable failures
// surface deep inside request handling instead of at startup, and make it
// easy to accidentally expose server secrets to client bundles.

export interface AppConfig {
  DATABASE_URL: string;
  PORT: number;
  JWT_SECRET: string;
  NODE_ENV: string;
  JWT_EXPIRES_IN: string;
  RAGX_ENCRYPTION_KEY: string;
  GEMINI_GUARD_API_KEY: string;
  WEB_APP_URL: string;
  STORAGE_DIR: string;
}

function readEnv(name: string, fallback?: string): string | undefined {
  const value = process.env[name];
  if (value !== undefined && value.length > 0) return value;
  return fallback;
}

function readRequiredEnv(name: string): string | undefined {
  const value = readEnv(name);
  // NOTE: warn instead of throwing so `bun test` / `turbo check-types`
  // work without a live database. The database layer throws a clear error
  // only when a connection is actually attempted.
  if (value === undefined) {
    console.warn(`[config] ${name} is not set; using empty placeholder until configured.`);
    return "";
  }
  return value;
}

//! Never log envConfig itself: it contains database credentials, JWT secrets,
// encryption keys, and API keys. Log only individual non-secret fields.
export const envConfig: AppConfig = {
  DATABASE_URL: readRequiredEnv("DATABASE_URL") ?? "",
  PORT: Number(readEnv("PORT", "3000")),
  JWT_SECRET: readEnv("JWT_SECRET", "change-me-in-production")!,
  NODE_ENV: readEnv("NODE_ENV", "development")!,
  JWT_EXPIRES_IN: readEnv("JWT_EXPIRES_IN", "7d")!,
  RAGX_ENCRYPTION_KEY: readEnv("RAGX_ENCRYPTION_KEY", "")!,
  GEMINI_GUARD_API_KEY: readEnv("GEMINI_GUARD_API_KEY", "")!,
  WEB_APP_URL: readEnv("WEB_APP_URL", "http://localhost:3000")!,
  // NOTE: `RAGX_STORAGE_DIR` is the canonical variable. `STORAGE_DIR` is
  // accepted as a legacy alias so existing deployments keep working.
  STORAGE_DIR:
    readEnv("RAGX_STORAGE_DIR", readEnv("STORAGE_DIR", "./storage"))!,
};

// TODO: promote to a hard startup failure (throw when required vars are
// missing and NODE_ENV=production) once deployment docs guarantee the vars.
if (envConfig.NODE_ENV === "production") {
  if (
    envConfig.JWT_SECRET === "change-me-in-production" ||
    envConfig.JWT_SECRET === "dev-only-secret-change-in-production"
  ) {
    console.warn(
      "[config] JWT_SECRET uses the dev fallback in production. Set JWT_SECRET.",
    );
  }
  if (!envConfig.RAGX_ENCRYPTION_KEY) {
    console.warn(
      "[config] RAGX_ENCRYPTION_KEY is empty; provider-credential encryption will fail at runtime.",
    );
  }
}

export const isProduction = envConfig.NODE_ENV === "production";
