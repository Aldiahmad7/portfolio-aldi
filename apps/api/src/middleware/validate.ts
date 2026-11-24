import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import type { z } from 'zod/mini'
import { AppError } from '../errors'

/** zValidator with the shared error format: failing fields are listed by path, never echoed back. */
export function validate<Target extends keyof ValidationTargets, Schema extends z.ZodMiniType>(
  target: Target,
  schema: Schema,
) {
  return zValidator(target, schema, (result) => {
    if (result.success) return
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))]
    throw new AppError('VALIDATION_ERROR', fields)
  })
}
