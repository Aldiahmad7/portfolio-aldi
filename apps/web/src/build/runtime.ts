import { createBubbles } from './bubbles'
import { createClock, type Clock, type ClockDependencies } from './clock'
import { CURSOR, MOBILE_QUERY } from './config'
import { createCrewControl, type CrewControl } from './crew-control'
import { watchGrabs } from './crew-grab'
import { createCursorPool, type CursorPool } from './cursor-pool'
import { runJob } from './job'
import { createLayer } from './overlay'
import { watchPage, type PageSignals } from './page-signals'
import { createSectionQueue, type SectionQueue } from './section-queue'
import type { ActionDefinition, ActionName } from './types'

/** Everything the director owns while building is on; torn down as a whole by stop(). */
export interface Runtime {
  clock: Clock
  layer: HTMLElement
  cursors: CursorPool
  page: PageSignals
  sections: SectionQueue
  crew: CrewControl
  /** Removes the catch-and-throw listeners and stops any flight. */
  stopGrabs: () => void
}

export interface RuntimeOptions {
  clock: Partial<ClockDependencies>
  actions: Readonly<Record<ActionName, ActionDefinition>>
  onProgress: (progress: number) => void
  onActiveChange: (id: string | null) => void
  onReducedMotion: () => void
}

/** Wires clock, decoration layer, cursors, bubbles, queue and page signals together. */
export function createRuntime(options: RuntimeOptions): Runtime {
  const isMobile = window.matchMedia(MOBILE_QUERY).matches
  const clock = createClock(options.clock)
  const layer = createLayer()
  const bubbles = createBubbles({
    clock,
    now: options.clock.now ?? (() => performance.now()),
    random: Math.random,
    enabled: !isMobile,
  })
  const cursors = createCursorPool(layer, clock, {
    maxVisible: isMobile ? CURSOR.maxMobile : CURSOR.maxDesktop,
    bubbles,
  })
  const sections = createSectionQueue(
    (config) =>
      runJob(config, {
        clock,
        layer,
        cursors,
        actions: options.actions,
        isMobile,
        onProgress: options.onProgress,
      }),
    options.onActiveChange,
  )
  const page = watchPage({
    onIntersect: (element, isInside) =>
      isInside ? sections.enter(element) : sections.leave(element),
    onHiddenChange: (hidden) => (hidden ? clock.pause() : clock.resume()),
    onResize: sections.finishActive,
    onFocusIn: sections.finishContaining,
    onReducedMotion: options.onReducedMotion,
  })
  const crew = createCrewControl(cursors, clock)
  const stopGrabs = watchGrabs({
    layer,
    cursors,
    crew,
    onGrabBusy: sections.finishActive,
    random: Math.random,
  })
  return { clock, layer, cursors, page, sections, crew, stopGrabs }
}
