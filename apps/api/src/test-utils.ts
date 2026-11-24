import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import { createApp } from './app'
import type { Database } from './db/client'
import * as schema from './db/schema'
import type { AppDependencies } from './env'

const MIGRATIONS = join(import.meta.dirname, '..', 'migrations')
const STATEMENT_BREAKPOINT = '--> statement-breakpoint'

/**
 * In-memory SQLite (built into Node) behind Drizzle's async proxy driver: same dialect as D1, and
 * the same migration files wrangler applies, so services are tested against the real schema.
 */
export function createTestDatabase(): { db: Database; sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(':memory:')
  for (const file of readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    const sql = readFileSync(join(MIGRATIONS, file), 'utf8')
    for (const statement of sql.split(STATEMENT_BREAKPOINT)) sqlite.exec(statement)
  }
  const db = drizzle(
    async (sql, params, method) => {
      const statement = sqlite.prepare(sql)
      if (method === 'run') {
        statement.run(...(params as never[]))
        return { rows: [] }
      }
      statement.setReturnArrays(true)
      // setReturnArrays makes each row an array of values, which the typings do not reflect.
      const rows = statement.all(...(params as never[])) as unknown as unknown[][]
      // 'get' expects one row as a flat array of values; the others expect a list of rows.
      return { rows: method === 'get' ? (rows[0] ?? []) : rows }
    },
    { schema },
  )
  return { db, sqlite }
}

export const allowRateLimit: RateLimit = { limit: async () => ({ success: true }) }

/** Worker bindings for `app.request()`; the database itself comes from `createTestDatabase`. */
export function testEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: {} as D1Database,
    RATE_LIMIT_COMMENTS: allowRateLimit,
    RATE_LIMIT_CONTACT: allowRateLimit,
    RATE_LIMIT_BUILDS: allowRateLimit,
    ALLOWED_ORIGINS: 'http://localhost:5173',
    CONTACT_TO_EMAIL: 'owner@example.com',
    CONTACT_FROM_EMAIL: 'portfolio@example.com',
    TURNSTILE_SECRET_KEY: 'secret',
    RESEND_API_KEY: 'resend-key',
    ...overrides,
  }
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** App wired to an in-memory database, a fixed clock and a fake fetch. */
export function createTestApp(overrides: Partial<AppDependencies> = {}) {
  const { db } = createTestDatabase()
  let id = 0
  const app = createApp({
    database: () => db,
    now: () => Date.UTC(2026, 10, 23),
    randomId: () => `id-${++id}`,
    fetch: async () => jsonResponse({ success: true }),
    ...overrides,
  })
  return { app, db }
}
