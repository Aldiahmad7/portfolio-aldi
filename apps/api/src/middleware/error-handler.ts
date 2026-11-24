import type { ErrorHandler, NotFoundHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../env'
import { AppError } from '../errors'

/** Every failure leaves as `{ error: { code, message } }`; details go to the log only. */
export const handleError: ErrorHandler<AppEnv> = (error, c) => {
  if (error instanceof AppError) return c.json(error.toBody(), error.status)
  // Hono's own errors (for example malformed JSON) are client mistakes, not crashes.
  if (error instanceof HTTPException && error.status < 500) {
    const invalid = new AppError('VALIDATION_ERROR')
    return c.json(invalid.toBody(), invalid.status)
  }
  console.error('Unhandled API error', error)
  const internal = new AppError('INTERNAL_ERROR')
  return c.json(internal.toBody(), internal.status)
}

export const handleNotFound: NotFoundHandler<AppEnv> = (c) => {
  const notFound = new AppError('NOT_FOUND')
  return c.json(notFound.toBody(), notFound.status)
}
