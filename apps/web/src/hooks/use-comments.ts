import { useSyncExternalStore } from 'react'
import { commentsStore, type CommentsState } from '../lib/comments-store'

/** Guestbook and comment mode read the same list. */
export function useComments(): CommentsState {
  return useSyncExternalStore(
    commentsStore.subscribe,
    commentsStore.getState,
    commentsStore.getServerState,
  )
}
