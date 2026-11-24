import { z } from 'zod/mini'
import { LIMITS, SECTION_IDS } from './limits'
import { cleanText } from './text'

const { commentName, commentMessage, contactName, contactMessage, position, page } = LIMITS

export const sectionIdSchema = z.enum(SECTION_IDS)
const percent = z.number().check(z.gte(position.min), z.lte(position.max))
const turnstileToken = z.string().check(z.minLength(1), z.maxLength(2048))

export const commentInputSchema = z.object({
  section: sectionIdSchema,
  x: percent,
  y: percent,
  name: cleanText(commentName.min, commentName.max),
  message: cleanText(commentMessage.min, commentMessage.max),
  turnstileToken,
})
export type CommentInput = z.infer<typeof commentInputSchema>

export const commentSchema = z.object({
  id: z.string(),
  section: sectionIdSchema,
  x: percent,
  y: percent,
  name: z.string(),
  message: z.string(),
  /** Unix time in milliseconds. */
  createdAt: z.number(),
})
export type Comment = z.infer<typeof commentSchema>

export const commentsQuerySchema = z.object({
  section: z.optional(sectionIdSchema),
  cursor: z.optional(z.string().check(z.maxLength(200))),
  limit: z._default(
    z.coerce.number().check(z.int(), z.gte(page.min), z.lte(page.max)),
    page.default,
  ),
})
export type CommentsQuery = z.infer<typeof commentsQuerySchema>

export const commentsPageSchema = z.object({
  items: z.array(commentSchema),
  nextCursor: z.nullable(z.string()),
})
export type CommentsPage = z.infer<typeof commentsPageSchema>

export const commentCreatedSchema = z.object({ item: commentSchema })

export const contactInputSchema = z.object({
  name: cleanText(contactName.min, contactName.max),
  email: z.email().check(z.maxLength(254)),
  message: cleanText(contactMessage.min, contactMessage.max),
  turnstileToken,
})
export type ContactInput = z.infer<typeof contactInputSchema>

export const contactSentSchema = z.object({ ok: z.literal(true) })

export const buildsCountSchema = z.object({ count: z.number().check(z.int(), z.gte(0)) })
export type BuildsCount = z.infer<typeof buildsCountSchema>
