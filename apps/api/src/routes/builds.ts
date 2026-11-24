import { Hono } from 'hono'
import type { AppEnv } from '../env'
import { rateLimit } from '../middleware/rate-limit'
import { incrementBuilds, readBuilds } from '../services/builds'

export const buildsRoute = new Hono<AppEnv>()
  .get('/', async (c) => c.json({ count: await readBuilds(c.var.db) }))
  .post('/', rateLimit('RATE_LIMIT_BUILDS'), async (c) =>
    c.json({ count: await incrementBuilds(c.var.db) }),
  )
