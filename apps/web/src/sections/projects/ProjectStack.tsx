import type { Ref } from 'react'
import { copy } from '../../app/copy'
import type { Project } from '../../content/types'
import type { StackLayout, StackPlan } from './project-stack'

interface ProjectStackProps {
  plan: StackPlan
  /** Regular (non-featured) projects, in display order. */
  regular: readonly Project[]
  controls: string
  onExpand: () => void
  ref: Ref<HTMLButtonElement>
}

/** Only one of these spans is displayed at a time, matching the layout's grid. */
const LAYOUT_ONLY: Record<StackLayout, string> = { compact: 'lg:hidden', wide: 'max-lg:hidden' }

/**
 * Back to front: two narrower sheets peek out above the front one, so the card reads as a pile.
 * On hover the back sheets lift a little (transform only).
 */
const SHEETS = [
  'inset-x-6 top-0 bottom-4 group-hover:-translate-y-1.5',
  'inset-x-3 top-2 bottom-2 group-hover:-translate-y-1',
  'inset-x-0 top-4 bottom-0 shadow-card group-hover:shadow-glow',
]

export function ProjectStack({ plan, regular, controls, onExpand, ref }: ProjectStackProps) {
  const layouts = (Object.keys(LAYOUT_ONLY) as StackLayout[]).flatMap((layout) => {
    const shown = plan[layout]
    return shown === null ? [] : [{ layout, hidden: regular.slice(shown) }]
  })

  return (
    <button
      ref={ref}
      type="button"
      data-build="project-stack"
      aria-expanded={false}
      aria-controls={controls}
      onClick={onExpand}
      className="group relative isolate flex h-full min-h-48 w-full flex-col items-center justify-center gap-3 rounded-md px-5 pt-9 pb-5 text-center"
    >
      {SHEETS.map((sheet) => (
        <span
          key={sheet}
          aria-hidden="true"
          className={`absolute -z-10 rounded-md border border-border bg-surface transition-transform duration-(--duration-base) ease-standard ${sheet}`}
        />
      ))}
      {layouts.map(({ layout, hidden }) => (
        <span key={layout} className={`flex flex-col items-center gap-2 ${LAYOUT_ONLY[layout]}`}>
          <span className="font-mono text-2xl font-semibold text-blue-light">
            {copy.projects.moreCount(hidden.length)}
          </span>
          <span className="font-mono text-sm">{copy.projects.showAll}</span>
          <span aria-hidden="true" className="text-xs text-text-secondary">
            {hidden.map((project) => project.title).join(' · ')}
          </span>
        </span>
      ))}
    </button>
  )
}
