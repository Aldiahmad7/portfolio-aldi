import type { ReactNode } from 'react'
import type { BuildScript } from '../../build/types'
import { useBuild } from '../../build/use-build'

interface SectionProps {
  id: string
  eyebrow: string
  title: string
  /** Module-level constant from build/scripts/ (see useBuild). */
  script: BuildScript
  children: ReactNode
}

export function Section({ id, eyebrow, title, script, children }: SectionProps) {
  const titleId = `${id}-title`
  const build = useBuild(script, { id, budget: 'default' })
  return (
    <section
      {...build}
      id={id}
      aria-labelledby={titleId}
      className="relative mx-auto max-w-content px-gutter py-section"
    >
      <p aria-hidden="true" className="font-mono text-xs text-blue-pale">
        {`// ${eyebrow}`}
      </p>
      <h2 id={titleId} data-build={titleId} className="mt-3 text-2xl font-semibold">
        {title}
      </h2>
      <div className="mt-10">{children}</div>
    </section>
  )
}
