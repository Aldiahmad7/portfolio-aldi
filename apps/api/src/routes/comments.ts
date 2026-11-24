import { commentInputSchema, commentsQuerySchema } from '@cursor-crew/shared'
import { Hono } from 'hono'
import { COMMENTS_CACHE_SECONDS } from '../config'
import type { AppDependencies, AppEnv } from '../env'
import { rateLimit } from '../middleware/rate-limit'
import { validate } from '../middleware/validate'
import { createComment, listComments } from '../services/comments'
import { verifyTurnstile } from '../services/turnstile'

const CREATED = 201

export function commentsRoute({ fetch, now, randomId }: AppDependencies) {
  return new Hono<AppEnv>()
    .get('/', validate('query', commentsQuerySchema), async (c) => {
      const page = await listComments(c.var.db, c.req.valid('query'))
      c.header('Cache-Control', `public, max-age=${COMMENTS_CACHE_SECONDS}`)
      return c.json(page)
    })
    .post(
      '/',
      rateLimit('RATE_LIMIT_COMMENTS'),
      validate('json', commentInputSchema),
      async (c) => {
        const { turnstileToken, ...input } = c.req.valid('json')
        const secret = c.env.TURNSTILE_SECRET_KEY
        await verifyTurnstile({ fetch, secret }, turnstileToken, c.req.header('CF-Connecting-IP'))
        const item = await createComment(c.var.db, input, { now, randomId })
        return c.json({ item }, CREATED)
      },
    )
}
