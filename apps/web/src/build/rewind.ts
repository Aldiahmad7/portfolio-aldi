import type { Clock } from './clock'
import { REWIND_MS } from './config'
import { BUILD_ATTRIBUTES, findTargets } from './reveal'
import type { SectionQueue } from './section-queue'

/**
 * Ctrl+Z: hides the built targets one by one, last first, within REWIND_MS on the build clock.
 * The opacity transition in build.css does the fading; the caller rebuilds afterwards.
 */
async function unbuildSection(section: Element, clock: Clock, signal: AbortSignal) {
  const built = [...findTargets(section).values()]
    .filter((target) => target.hasAttribute(BUILD_ATTRIBUTES.built))
    .reverse()
  const gap = built.length > 0 ? REWIND_MS / built.length : 0
  for (const target of built) {
    target.removeAttribute(BUILD_ATTRIBUTES.built)
    await clock.wait(gap, signal)
  }
}

/**
 * Unbuilds the given (or most visible) section and queues it again. Only a fully built section
 * rewinds, and never while a job runs (docs/interactions.md §5). Returns whether it started.
 */
export function rewindSection(
  sections: SectionQueue,
  clock: Clock,
  id: string | undefined,
  signal: AbortSignal,
) {
  const section = sections.pick(id)
  if (sections.hasActiveJob() || section?.status !== 'built') return false
  unbuildSection(section.element, clock, signal).then(
    () => sections.replay(section.id),
    () => {}, // Aborted by redo or skip; they show the section themselves.
  )
  return true
}
