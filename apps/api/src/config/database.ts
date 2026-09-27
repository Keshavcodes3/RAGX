import { drizzle } from "drizzle-orm/node-postgres";

import { envConfig } from "./envConfig";

// NOTE: all runtime code resolves configuration through `envConfig`.
// `process.env.DATABASE_URL` is read in exactly one other place —
// `drizzle.config.ts` — because drizzle-kit runs outside the app process
// and cannot import the running server config.
export const db = drizzle(envConfig.DATABASE_URL);
