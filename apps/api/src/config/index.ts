// NOTE: config barrel — single import point for app configuration.
// New code should `import { db, envConfig } from "@/config"` instead of
// reaching into per-file paths or `process.env` directly.
export { db } from "./database";
export { envConfig, isProduction } from "./envConfig";
export type { AppConfig } from "./envConfig";
