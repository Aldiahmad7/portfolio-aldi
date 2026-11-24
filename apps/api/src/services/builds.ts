import { eq, sql } from 'drizzle-orm'
import { BUILDS_COUNTER_KEY } from '../config'
import type { Database } from '../db/client'
import { counters } from '../db/schema'

export async function readBuilds(db: Database): Promise<number> {
  const [row] = await db
    .select({ value: counters.value })
    .from(counters)
    .where(eq(counters.key, BUILDS_COUNTER_KEY))
  return row?.value ?? 0
}

/** One atomic statement (insert or increment), so concurrent visits never lose a count. */
export async function incrementBuilds(db: Database): Promise<number> {
  const [row] = await db
    .insert(counters)
    .values({ key: BUILDS_COUNTER_KEY, value: 1 })
    .onConflictDoUpdate({ target: counters.key, set: { value: sql`${counters.value} + 1` } })
    .returning({ value: counters.value })
  return row?.value ?? 0
}
