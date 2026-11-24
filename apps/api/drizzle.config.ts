import { defineConfig } from 'drizzle-kit'

/** `pnpm --filter @cursor-crew/api db:generate` writes SQL migrations that wrangler applies to D1. */
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './migrations',
})
