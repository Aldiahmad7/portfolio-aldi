import { copy } from '../../app/copy'
import { experience } from '../../content/experience'
import type { Experience } from '../../content/types'
import { formatYearMonth } from '../../lib/format-date'

const formatEnd = (end: Experience['end']) =>
  end === 'present' ? copy.about.present : formatYearMonth(end)

export function Timeline() {
  return (
    <ol className="mt-6 space-y-8 border-l border-border pl-6">
      {experience.map((item, index) => (
        <li key={`${item.company}-${item.start}`} data-build={`about-job-${index}`}>
          <p className="font-mono text-xs text-text-secondary">
            {formatYearMonth(item.start)} — {formatEnd(item.end)}
          </p>
          <h4 className="mt-1 text-lg font-semibold">
            {item.title} · <span className="text-blue-light">{item.company}</span>
          </h4>
          <p className="mt-2 max-w-2xl text-text-secondary">{item.summary}</p>
        </li>
      ))}
    </ol>
  )
}
