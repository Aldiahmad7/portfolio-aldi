import { contactInputSchema } from '@cursor-crew/shared'
import { Hono } from 'hono'
import type { AppDependencies, AppEnv } from '../env'
import { rateLimit } from '../middleware/rate-limit'
import { validate } from '../middleware/validate'
import { sendContact } from '../services/contact'
import { verifyTurnstile } from '../services/turnstile'

const ACCEPTED = 202

export function contactRoute({ fetch }: AppDependencies) {
  return new Hono<AppEnv>().post(
    '/',
    rateLimit('RATE_LIMIT_CONTACT'),
    validate('json', contactInputSchema),
    async (c) => {
      const { turnstileToken, ...input } = c.req.valid('json')
      const { env } = c
      await verifyTurnstile(
        { fetch, secret: env.TURNSTILE_SECRET_KEY },
        turnstileToken,
        c.req.header('CF-Connecting-IP'),
      )
      const email = {
        apiKey: env.RESEND_API_KEY,
        to: env.CONTACT_TO_EMAIL,
        from: env.CONTACT_FROM_EMAIL,
      }
      await sendContact({ fetch, ...email }, input)
      return c.json({ ok: true } as const, ACCEPTED)
    },
  )
}
