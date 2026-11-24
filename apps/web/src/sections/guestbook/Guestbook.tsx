import { useCallback } from 'react'
import { copy } from '../../app/copy'
import { guestbookScript } from '../../build/scripts/guestbook'
import { CommentForm } from '../../components/comment-pin/CommentForm'
import { buttonClass } from '../../components/ui/button'
import { Section } from '../../components/ui/Section'
import { useComments } from '../../hooks/use-comments'
import { commentsStore } from '../../lib/comments-store'
import { CommentList } from './CommentList'
import { useLoadNearViewport } from './use-load-near-viewport'

/** The keyboard-friendly way to comment: no pin placing, the comment sits in the guestbook. */
const GUESTBOOK_TARGET = { section: 'guestbook', x: 50, y: 50 } as const

export function Guestbook() {
  const { eyebrow, title } = copy.sections.guestbook
  const { status, items, nextCursor, loadingMore } = useComments()
  const load = useCallback(() => void commentsStore.load(), [])
  const board = useLoadNearViewport<HTMLDivElement>(load)

  return (
    <Section id="guestbook" eyebrow={eyebrow} title={title} script={guestbookScript}>
      <p data-build="guestbook-intro" className="max-w-2xl text-text-secondary">
        {copy.guestbook.intro}
      </p>
      <div
        ref={board}
        data-build="guestbook-board"
        aria-busy={status === 'loading' || loadingMore}
        className="mt-8 grid gap-8 rounded-md border border-dashed border-border bg-surface p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr]"
      >
        <div className="min-w-0 space-y-4">
          {status === 'offline' && <p className="text-text-secondary">{copy.guestbook.offline}</p>}
          {(status === 'idle' || status === 'loading') && (
            <p className="font-mono text-sm text-text-secondary">{copy.guestbook.loading}</p>
          )}
          {status === 'ready' && items.length === 0 && (
            <p className="text-text-secondary">{copy.guestbook.empty}</p>
          )}
          {items.length > 0 && <CommentList items={items} />}
          {nextCursor && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void commentsStore.loadMore()}
              className={`${buttonClass('ghost')} disabled:opacity-60`}
            >
              {copy.guestbook.loadMore}
            </button>
          )}
        </div>
        {status !== 'offline' && (
          <div className="space-y-4">
            <h3 className="font-mono text-sm text-blue-pale">{copy.guestbook.formTitle}</h3>
            <CommentForm target={GUESTBOOK_TARGET} />
            <p className="text-sm text-text-secondary">{copy.guestbook.pinHint}</p>
          </div>
        )}
      </div>
    </Section>
  )
}
