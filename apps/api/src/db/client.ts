import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

/** What services need: any async SQLite Drizzle database (D1 in the Worker, node:sqlite in tests). */
export type Database = BaseSQLiteDatabase<'async', unknown, typeof schema>

export function createDatabase(binding: D1Database): Database {
  return drizzle(binding, { schema })
}
