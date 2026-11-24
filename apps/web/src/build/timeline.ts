import type { BuildScript } from './types'

export interface ScheduledStep {
  start: number
  duration: number
}

export interface Timeline {
  steps: ScheduledStep[]
  total: number
}

const MS_PER_SECOND = 1000

/**
 * Planned schedule at 1×. A step without `at` starts when the previous step (array order) ends;
 * a step with `at` starts at that absolute time and the following steps chain from it.
 */
export function buildTimeline(script: BuildScript, durations: readonly number[]): Timeline {
  let previousEnd = 0
  const steps = script.map((step, index) => {
    const start = step.at === undefined ? previousEnd : step.at * MS_PER_SECOND
    const duration = durations[index] ?? 0
    previousEnd = start + duration
    return { start, duration }
  })
  const total = Math.max(0, ...steps.map((step) => step.start + step.duration))
  return { steps, total }
}

/** End of the last step that builds something; decorative steps (Intern's visit) do not count. */
export function contentTotal(timeline: Timeline, decorative: readonly boolean[]) {
  const ends = timeline.steps.map((step, index) =>
    decorative[index] ? 0 : step.start + step.duration,
  )
  return Math.max(0, ...ends)
}
