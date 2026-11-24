import type { Comment } from '@cursor-crew/shared'
import { api } from './api'

export interface CommentsState {
  status: 'idle' | 'loading' | 'ready' | 'offline'
  /** Newest first, all sections: the Guestbook lists them, comment mode pins them. */
  items: readonly Comment[]
  nextCursor: string | null
  loadingMore: boolean
}

const initial: CommentsState = { status: 'idle', items: [], nextCursor: null, loadingMore: false }

/** One shared list for the Guestbook and comment mode, so a new comment shows up in both. */
export function createCommentsStore(client: Pick<typeof api, 'comments'> = api) {
  let state = initial
  const listeners = new Set<() => void>()
  const set = (patch: Partial<CommentsState>) => {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  }
  const known = (id: string) => state.items.some((item) => item.id === id)

  return {
    getState: () => state,
    getServerState: () => initial,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    /** First page; later calls do nothing unless the last attempt failed. */
    async load() {
      if (state.status === 'loading' || state.status === 'ready') return
      set({ status: 'loading' })
      const result = await client.comments(null)
      if (!result.ok) return set({ status: 'offline' })
      set({ status: 'ready', items: result.data.items, nextCursor: result.data.nextCursor })
    },
    async loadMore() {
      if (!state.nextCursor || state.loadingMore) return
      set({ loadingMore: true })
      const result = await client.comments(state.nextCursor)
      if (!result.ok) return set({ loadingMore: false })
      const fresh = result.data.items.filter((item) => !known(item.id))
      set({
        items: [...state.items, ...fresh],
        nextCursor: result.data.nextCursor,
        loadingMore: false,
      })
    },
    /** The visitor's own new comment (the GET is cached for 30 s, so it would not show up yet). */
    add(item: Comment) {
      if (!known(item.id)) set({ items: [item, ...state.items] })
    },
  }
}

export type CommentsStore = ReturnType<typeof createCommentsStore>
export const commentsStore = createCommentsStore()
