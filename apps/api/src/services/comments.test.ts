import { describe, expect, it } from 'vitest'
import type { AppError } from '../errors'
import { createTestDatabase } from '../test-utils'
import { createComment, listComments } from './comments'

const input = { section: 'guestbook', x: 50, y: 50, name: 'Rina', message: 'Keren!' } as const

async function seed(count: number) {
  const { db, sqlite } = createTestDatabase()
  for (let index = 0; index < count; index++) {
    await createComment(db, input, { now: () => 1000 + index, randomId: () => `id-${index}` })
  }
  return { db, sqlite }
}

describe('comments service', () => {
  it('stores a comment and lists the newest first', async () => {
    const { db } = await seed(3)
    const page = await listComments(db, { limit: 20 })
    expect(page.items.map((item) => item.id)).toEqual(['id-2', 'id-1', 'id-0'])
    expect(page.items[0]).toMatchObject({ ...input, createdAt: 1002 })
    expect(page.nextCursor).toBeNull()
  })

  it('pages with a cursor without skipping or repeating', async () => {
    const { db } = await seed(5)
    const first = await listComments(db, { limit: 2 })
    expect(first.items.map((item) => item.id)).toEqual(['id-4', 'id-3'])
    const second = await listComments(db, { limit: 2, cursor: first.nextCursor ?? '' })
    expect(second.items.map((item) => item.id)).toEqual(['id-2', 'id-1'])
    const third = await listComments(db, { limit: 2, cursor: second.nextCursor ?? '' })
    expect(third.items.map((item) => item.id)).toEqual(['id-0'])
    expect(third.nextCursor).toBeNull()
  })

  it('leaves out hidden comments and filters by section', async () => {
    const { db, sqlite } = await seed(2)
    await createComment(
      db,
      { ...input, section: 'hero' },
      { now: () => 5000, randomId: () => 'hero-1' },
    )
    sqlite.exec(`UPDATE comments SET hidden = 1 WHERE id = 'id-0'`)
    const all = await listComments(db, { limit: 20 })
    expect(all.items.map((item) => item.id)).toEqual(['hero-1', 'id-1'])
    const hero = await listComments(db, { limit: 20, section: 'hero' })
    expect(hero.items.map((item) => item.id)).toEqual(['hero-1'])
  })

  it('rejects profanity before writing anything', async () => {
    const { db } = createTestDatabase()
    const rude = createComment(
      db,
      { ...input, message: 'dasar goblok' },
      {
        now: () => 1,
        randomId: () => 'rude',
      },
    )
    await expect(rude).rejects.toMatchObject({
      code: 'CONTENT_REJECTED',
    } satisfies Partial<AppError>)
    expect((await listComments(db, { limit: 20 })).items).toHaveLength(0)
  })

  it('rejects a malformed cursor as a validation error', async () => {
    const { db } = createTestDatabase()
    await expect(listComments(db, { limit: 20, cursor: 'nope' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    })
  })
})
