import {
  containsProfanity,
  type Comment,
  type CommentInput,
  type CommentsPage,
  type CommentsQuery,
  type SectionId,
} from '@cursor-crew/shared'
import { and, desc, eq, lt, or, type SQL } from 'drizzle-orm'
import type { Database } from '../db/client'
import { comments } from '../db/schema'
import { AppError } from '../errors'

const CURSOR_SEPARATOR = '_'

const columns = {
  id: comments.id,
  section: comments.section,
  x: comments.x,
  y: comments.y,
  name: comments.name,
  message: comments.message,
  createdAt: comments.createdAt,
}

/** The cursor is the last item's `createdAt` and `id`, so pages stay stable while comments arrive. */
export const encodeCursor = (item: Pick<Comment, 'createdAt' | 'id'>) =>
  `${item.createdAt}${CURSOR_SEPARATOR}${item.id}`

function decodeCursor(cursor: string): { createdAt: number; id: string } {
  const separator = cursor.indexOf(CURSOR_SEPARATOR)
  const createdAt = Number(cursor.slice(0, separator))
  const id = cursor.slice(separator + 1)
  if (separator < 1 || !Number.isSafeInteger(createdAt) || !id) {
    throw new AppError('VALIDATION_ERROR', ['cursor'])
  }
  return { createdAt, id }
}

export async function listComments(db: Database, query: CommentsQuery): Promise<CommentsPage> {
  const filters: (SQL | undefined)[] = [eq(comments.hidden, false)]
  if (query.section) filters.push(eq(comments.section, query.section))
  if (query.cursor) {
    const after = decodeCursor(query.cursor)
    filters.push(
      or(
        lt(comments.createdAt, after.createdAt),
        and(eq(comments.createdAt, after.createdAt), lt(comments.id, after.id)),
      ),
    )
  }
  // One extra row tells whether another page exists.
  const rows = await db
    .select(columns)
    .from(comments)
    .where(and(...filters))
    .orderBy(desc(comments.createdAt), desc(comments.id))
    .limit(query.limit + 1)
  const items = rows.slice(0, query.limit).map(toComment)
  const last = items.at(-1)
  return { items, nextCursor: rows.length > query.limit && last ? encodeCursor(last) : null }
}

interface CreateDependencies {
  now: () => number
  randomId: () => string
}

export async function createComment(
  db: Database,
  input: Omit<CommentInput, 'turnstileToken'>,
  { now, randomId }: CreateDependencies,
): Promise<Comment> {
  if (containsProfanity(input.name, input.message)) throw new AppError('CONTENT_REJECTED')
  const item: Comment = {
    id: randomId(),
    section: input.section,
    x: input.x,
    y: input.y,
    name: input.name,
    message: input.message,
    createdAt: now(),
  }
  await db.insert(comments).values(item)
  return item
}

/** Rows only ever hold valid section ids: they are written through the validated schema above. */
function toComment(
  row: typeof comments.$inferSelect | Omit<typeof comments.$inferSelect, 'hidden'>,
) {
  return { ...row, section: row.section as SectionId } satisfies Comment
}
