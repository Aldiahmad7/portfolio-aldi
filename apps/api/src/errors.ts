import { ERROR_STATUS, type ApiError, type ErrorCode } from '@cursor-crew/shared'

/** User-facing messages: friendly and generic, never internal details. */
const MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Some fields are not valid.',
  TURNSTILE_FAILED: 'Could not verify that you are human. Please try again.',
  NOT_FOUND: 'Not found.',
  CONTENT_REJECTED: 'Please keep it friendly.',
  RATE_LIMITED: 'Too many requests. Try again in a minute.',
  INTERNAL_ERROR: 'Something went wrong on our side.',
  UPSTREAM_ERROR: 'A service we depend on is not responding. Please try again later.',
}

/** Thrown by services and middleware; the error handler turns it into `{ error: { code, message } }`. */
export class AppError extends Error {
  readonly code: ErrorCode
  readonly fields: readonly string[] | undefined

  constructor(code: ErrorCode, fields?: readonly string[]) {
    super(MESSAGES[code])
    this.name = 'AppError'
    this.code = code
    this.fields = fields
  }

  get status() {
    return ERROR_STATUS[this.code]
  }

  toBody(): { error: ApiError } {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.fields && { fields: [...this.fields] }),
      },
    }
  }
}
