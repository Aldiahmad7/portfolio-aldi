import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { secureHeaders } from 'hono/secure-headers'
import { BODY_LIMIT_BYTES } from './config'
import { createDatabase } from './db/client'
import type { AppDependencies, AppEnv } from './env'
import { AppError } from './errors'
import { allowListedOrigins } from './middleware/cors'
import { handleError, handleNotFound } from './middleware/error-handler'
import { buildsRoute } from './routes/builds'
import { commentsRoute } from './routes/comments'
import { contactRoute } from './routes/contact'

const defaults: AppDependencies = {
  database: (env) => createDatabase(env.DB),
  // Bound so the Workers runtime does not complain about an unbound global fetch.
  fetch: (input, init) => fetch(input, init),
  now: () => Date.now(),
  randomId: () => crypto.randomUUID(),
}

/** Builds the API. Tests pass their own dependencies (database, fetch, clock, ids). */
export function createApp(overrides: Partial<AppDependencies> = {}) {
  const dependencies = { ...defaults, ...overrides }
  const api = new Hono<AppEnv>()
    .use(secureHeaders())
    .use(allowListedOrigins)
    .use(
      bodyLimit({
        maxSize: BODY_LIMIT_BYTES,
        onError: () => {
          throw new AppError('VALIDATION_ERROR')
        },
      }),
    )
    .use(async (c, next) => {
      c.set('db', dependencies.database(c.env))
      await next()
    })
    .route('/builds', buildsRoute)
    .route('/comments', commentsRoute(dependencies))
    .route('/contact', contactRoute(dependencies))

  const app = new Hono<AppEnv>().route('/api', api)
  app.onError(handleError)
  app.notFound(handleNotFound)
  return app
}
