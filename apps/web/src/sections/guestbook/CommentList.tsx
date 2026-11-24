import type { Comment } from '@cursor-crew/shared'
import { copy } from '../../app/copy'
import { formatDay } from '../../lib/format-date'

/** Comments as plain text (React escapes it; no HTML from visitors ever reaches the page). */
export function CommentList({ items }: { items: readonly Comment[] }) {
  return (
    <ul aria-label={copy.guestbook.listLabel} className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="rounded-sm border border-border bg-bg p-4">
          <p className="flex flex-wrap gap-x-2 font-mono text-xs text-text-secondary">
            <span className="text-blue-pale">{item.name}</span>
            <span aria-hidden="true">·</span>
            <span>{copy.comments.sectionNames[item.section]}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={new Date(item.createdAt).toISOString()}>
              {formatDay(item.createdAt)}
            </time>
          </p>
          <p className="mt-2 break-words whitespace-pre-line">{item.message}</p>
        </li>
      ))}
    </ul>
  )
}
