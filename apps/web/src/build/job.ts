import type { Clock } from './clock'
import { crew } from './crew'
import type { CursorPool } from './cursor-pool'
import { createOverlay, documentRect } from './overlay'
import { findTargets, revealSection, revealTarget } from './reveal'
import { buildTimeline, contentTotal } from './timeline'
import type { ActionDefinition, ActionName, BuildStep, SectionConfig } from './types'

export interface JobDependencies {
  clock: Clock
  layer: HTMLElement
  cursors: CursorPool
  actions: Readonly<Record<ActionName, ActionDefinition>>
  isMobile: boolean
  onProgress: (progress: number) => void
}

export interface Job {
  /** Resolves once every target is revealed and decorations are removed. Never rejects. */
  done: Promise<void>
  /** Stops at once; `done` still runs the cleanup. */
  finish: () => void
}

interface RunnableStep {
  step: BuildStep
  target: HTMLElement
  action: ActionDefinition
}

const MS_PER_SECOND = 1000
const ignore = () => {}
const settled = (promise: Promise<unknown>) => promise.then(ignore, ignore)

/** Invalid steps are skipped here; validate.ts reports them in development. */
function runnableSteps(section: SectionConfig, dependencies: JobDependencies): RunnableStep[] {
  const targets = findTargets(section.element)
  return section.script.flatMap((step) => {
    const target = targets.get(step.target)
    const action = Object.hasOwn(dependencies.actions, step.do)
      ? dependencies.actions[step.do]
      : undefined
    const valid = target && action && Object.hasOwn(crew, step.by) && (step.at ?? 0) >= 0
    const mobileSkip = dependencies.isMobile && step.mobile === false
    return valid && !mobileSkip ? [{ step, target, action }] : []
  })
}

/** Runs one section's script. Whatever happens (finish, error), all its targets end up revealed. */
export function runJob(section: SectionConfig, dependencies: JobDependencies): Job {
  const { clock, layer, cursors, onProgress } = dependencies
  const controller = new AbortController()
  const { signal } = controller
  const overlay = createOverlay(layer)
  const steps = runnableSteps(section, dependencies)
  const timeline = buildTimeline(
    steps.map(({ step }) => step),
    steps.map(({ step, target, action }) => action.duration(step, target)),
  )
  const buildTotal = contentTotal(
    timeline,
    steps.map(({ action }) => action.decorative ?? false),
  )
  let reached = 0

  async function runStep({ step, target, action }: RunnableStep, index: number) {
    signal.throwIfAborted()
    const cursor = cursors.acquire(step.by, signal)
    try {
      if (cursor) {
        if (step.say) cursor.say(step.say)
        await action.run({
          by: step.by,
          target,
          rect: documentRect(target),
          cursor,
          overlay,
          play: (element, keyframes, ms) => clock.play(element, keyframes, ms, signal),
          wait: (ms) => clock.wait(ms, signal),
          reveal: () => revealTarget(target),
          oops: step.oops ?? false,
          signal,
        })
      }
    } catch (error) {
      if (signal.aborted) throw error
      // A broken action must never hide content: reveal below and let the job continue.
      if (import.meta.env.DEV) console.error(`[build] ${section.id}: ${step.do} failed`, error)
    }
    revealTarget(target)
    const scheduled = timeline.steps[index]
    if (scheduled && buildTotal > 0 && !action.decorative) {
      reached = Math.max(reached, scheduled.start + scheduled.duration)
      onProgress(reached / buildTotal)
    }
  }

  let previous: Promise<void> = Promise.resolve()
  const busy = new Map<BuildStep['by'], Promise<void>>()
  const running = steps.map((runnable, index) => {
    const { at, by } = runnable.step
    const start = at === undefined ? settled(previous) : clock.wait(at * MS_PER_SECOND, signal)
    const cursorFree = settled(busy.get(by) ?? Promise.resolve())
    const promise = Promise.all([start, cursorFree]).then(() => runStep(runnable, index))
    previous = promise
    busy.set(by, promise)
    return promise
  })

  onProgress(0)
  const done = Promise.allSettled(running).then(() => {
    revealSection(section.element)
    overlay.clear()
    // Cursors stay parked where they finished (ADR 0005).
    cursors.idle()
    onProgress(1)
  })

  return { done, finish: () => controller.abort() }
}
