import type { Comment } from '@cursor-crew/shared'
import { describe, expect, it, vi } from 'vitest'
import type { Result } from './api-client'
import { createCommentsStore } from './comments-store'

const comment = (id: string): Comment => ({
  id,
  section: 'guestbook',
  x: 50,
  y: 50,
  name: 'Rina',
  message: 'Halo',
  createdAt: 1,
})
const page = (ids: string[], nextCursor: string | null) =>
  ({ ok: true, data: { items: ids.map(comment), nextCursor } }) as const

describe('comments store', () => {
  it('loads the first page once and appends the next page without duplicates', async () => {
    const comments = vi
      .fn<
        (cursor: string | null) => Promise<Result<{ items: Comment[]; nextCursor: string | null }>>
      >()
      .mockResolvedValueOnce(page(['b', 'a'], 'cursor-1'))
      .mockResolvedValueOnce(page(['a', 'z'], null))
    const store = createCommentsStore({ comments })
    await store.load()
    await store.load()
    expect(comments).toHaveBeenCalledTimes(1)
    await store.loadMore()
    expect(comments).toHaveBeenLastCalledWith('cursor-1')
    expect(store.getState().items.map((item) => item.id)).toEqual(['b', 'a', 'z'])
    expect(store.getState().nextCursor).toBeNull()
  })

  it('goes offline when the API fails, and can retry later', async () => {
    const comments = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: { code: 'OFFLINE' } })
      .mockResolvedValueOnce(page(['a'], null))
    const store = createCommentsStore({ comments })
    await store.load()
    expect(store.getState().status).toBe('offline')
    await store.load()
    expect(store.getState().status).toBe('ready')
  })

  it('puts the visitor’s new comment first', async () => {
    const store = createCommentsStore({ comments: async () => page(['a'], null) })
    await store.load()
    store.add(comment('mine'))
    store.add(comment('mine'))
    expect(store.getState().items.map((item) => item.id)).toEqual(['mine', 'a'])
  })
})
