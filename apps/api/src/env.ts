import type { Database } from './db/client'

/** Hono environment: Worker bindings (generated `Env`) plus per-request variables set by middleware. */
export interface AppEnv {
  Bindings: Env
  Variables: { db: Database }
}

/** Collaborators that tests replace; the Worker uses the real ones. */
export interface AppDependencies {
  database: (env: Env) => Database
  fetch: typeof fetch
  now: () => number
  randomId: () => string
}
