import { createMiddleware } from 'hono/factory'
import { LOCAL_CLIENT_KEY } from '../config'
import type { AppEnv } from '../env'
import { AppError } from '../errors'

type RateLimitBinding = 'RATE_LIMIT_COMMENTS' | 'RATE_LIMIT_CONTACT' | 'RATE_LIMIT_BUILDS'

/** Runs first on a write route: one Rate Limiting binding per route, keyed by client IP + route. */
export function rateLimit(binding: RateLimitBinding) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') ?? LOCAL_CLIENT_KEY
    const { success } = await c.env[binding].limit({ key: `${ip}:${c.req.path}` })
    if (!success) throw new AppError('RATE_LIMITED')
    await next()
  })
}
