import { z } from 'zod/mini'

/** Every API error code with its HTTP status (docs/backend-api.md §2). */
export const ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  TURNSTILE_FAILED: 403,
  NOT_FOUND: 404,
  CONTENT_REJECTED: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  UPSTREAM_ERROR: 502,
} as const
export type ErrorCode = keyof typeof ERROR_STATUS

const ERROR_CODES = Object.keys(ERROR_STATUS) as [ErrorCode, ...ErrorCode[]]

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    fields: z.optional(z.array(z.string())),
  }),
})
export type ApiError = z.infer<typeof apiErrorSchema>['error']
