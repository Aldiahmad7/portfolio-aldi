import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../env'

/**
 * Production is same-origin (ADR-0004), so CORS only matters for development and preview origins
 * listed in ALLOWED_ORIGINS (comma separated). Unknown origins get no CORS headers.
 */
export const allowListedOrigins = createMiddleware<AppEnv>((c, next) => {
  const allowed = c.env.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  return cors({ origin: (origin) => (allowed.includes(origin) ? origin : null) })(c, next)
})
