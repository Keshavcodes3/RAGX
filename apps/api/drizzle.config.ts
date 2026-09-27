import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// NOTE: drizzle-kit runs outside the app process, so it reads
// `process.env.DATABASE_URL` directly instead of `src/config/envConfig.ts`
// (the app's centralized config). Keep the two in sync: the app validates
// via envConfig, this file only needs the raw URL for generate/migrate.
export default defineConfig({
  out: './drizzle',
  schema: './src/DB/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
