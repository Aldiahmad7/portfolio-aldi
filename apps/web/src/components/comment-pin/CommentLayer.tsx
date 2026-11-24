import { useEffect, useState } from 'react'
import { copy } from '../../app/copy'
import { useComments } from '../../hooks/use-comments'
import { commentsStore } from '../../lib/comments-store'
import { formatDay } from '../../lib/format-date'
import { CommentForm } from './CommentForm'
import { Pin } from './Pin'
import type { CommentTarget } from './use-comment-form'
import { COMMENT_UI_ATTRIBUTE, useCommentPlacement } from './use-comment-placement'

const initialOf = (name: string) => name.trim().charAt(0).toUpperCase()

/** Comment mode (docs/interactions.md §7): every pin, plus a draft pin where the visitor clicked. */
export default function CommentLayer({ onExit }: { onExit: () => void }) {
  const { items } = useComments()
  const [draft, setDraft] = useState<CommentTarget | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => void commentsStore.load(), [])
  useCommentPlacement({
    onPlace(target) {
      setOpenId(null)
      setDraft(target)
    },
    onEscape() {
      if (draft) setDraft(null)
      else if (openId) setOpenId(null)
      else onExit()
    },
  })

  return (
    <>
      <p
        role="status"
        {...{ [COMMENT_UI_ATTRIBUTE]: '' }}
        className="fixed top-4 left-1/2 z-50 w-max max-w-[calc(100vw-2*var(--spacing-gutter))] -translate-x-1/2 rounded-pill border border-border bg-surface px-4 py-2 font-mono text-xs shadow-hud"
      >
        {copy.comments.modeOn}
      </p>
      {items.map((item) => (
        <Pin
          key={item.id}
          target={item}
          label={copy.comments.commentFrom(item.name)}
          initial={initialOf(item.name)}
          open={openId === item.id}
          onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
        >
          <p className="font-mono text-xs text-text-secondary">
            <span className="text-blue-pale">{item.name}</span> · {formatDay(item.createdAt)}
          </p>
          <p className="mt-2 break-words whitespace-pre-line">{item.message}</p>
        </Pin>
      ))}
      {draft && (
        <Pin
          key={`${draft.section}-${draft.x}-${draft.y}`}
          target={draft}
          label={copy.comments.draftLabel}
          initial="+"
          open
        >
          <CommentForm
            focusOnOpen
            target={draft}
            onCancel={() => setDraft(null)}
            onPosted={(item) => {
              setDraft(null)
              setOpenId(item.id)
            }}
          />
        </Pin>
      )}
    </>
  )
}
