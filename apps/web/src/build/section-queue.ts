import type { Job } from './job'
import { hideSection, revealSection } from './reveal'
import { byDocumentOrder, isFullyBuilt, visibleHeight } from './section-geometry'
import type { SectionConfig } from './types'

export type Status = 'pending' | 'queued' | 'building' | 'built'

interface Entry {
  config: SectionConfig
  status: Status
  job: Job | null
}

export interface SectionQueue {
  add: (config: SectionConfig) => void
  remove: (id: string) => void
  enter: (element: Element) => void
  leave: (element: Element) => void
  finishContaining: (node: Node) => void
  finishActive: () => void
  finishAll: () => void
  /** Rebuilds the given section, or the one taking most of the viewport. */
  replay: (id?: string) => void
  /** The given section, or the one taking most of the viewport. */
  pick: (id?: string) => { id: string; element: HTMLElement; status: Status } | null
  /** Shows the given (or most visible) section at once. */
  finish: (id?: string) => void
  hasActiveJob: () => boolean
  /** Stops the running job; a waiting section goes back to pending. */
  reset: () => void
}

/** Decides which section builds when: at most one job runs and at most one section waits. */
export function createSectionQueue(
  startJob: (config: SectionConfig) => Job,
  onActiveChange: (id: string | null) => void,
): SectionQueue {
  const entries = new Map<string, Entry>()
  let waiting: Entry | null = null
  let active: Entry | null = null

  const inDocumentOrder = () =>
    [...entries.values()].sort((a, b) => byDocumentOrder(a.config.element, b.config.element))
  const find = (match: (entry: Entry) => boolean) => [...entries.values()].find(match)

  function pick(id?: string) {
    const byVisibility = (a: Entry, b: Entry) =>
      visibleHeight(b.config.element) - visibleHeight(a.config.element)
    return (id ? entries.get(id) : [...entries.values()].sort(byVisibility)[0]) ?? null
  }

  function finish(entry: Entry) {
    if (entry.status === 'building') return entry.job?.finish()
    if (waiting === entry) waiting = null
    revealSection(entry.config.element)
    entry.status = 'built'
  }

  function next() {
    if (active || !waiting) return
    const entry = waiting
    waiting = null
    entry.status = 'building'
    active = entry
    onActiveChange(entry.config.id)
    const job = startJob(entry.config)
    entry.job = job
    void job.done.then(() => {
      entry.status = 'built'
      entry.job = null
      active = null
      onActiveChange(null)
      next()
    })
  }

  function queue(entry: Entry) {
    if (waiting) finish(waiting)
    entry.status = 'queued'
    waiting = entry
    next()
  }

  return {
    add(config) {
      const status = isFullyBuilt(config.element) ? 'built' : 'pending'
      entries.set(config.id, { config, status, job: null })
    },
    remove(id) {
      const entry = entries.get(id)
      if (!entry) return
      entry.job?.finish()
      if (waiting === entry) waiting = null
      entries.delete(id)
    },
    enter(element) {
      const entry = find((candidate) => candidate.config.element === element)
      if (entry?.status !== 'pending') return
      // Sections above that never built (reload mid-page, fast scroll) appear at once.
      for (const other of inDocumentOrder()) {
        if (other === entry) break
        if (other.status === 'pending') finish(other)
      }
      queue(entry)
    },
    leave(element) {
      const entry = find((candidate) => candidate.config.element === element)
      if (entry?.status === 'building') finish(entry)
      if (entry && entry === waiting) {
        waiting = null
        entry.status = 'pending'
      }
    },
    finishContaining(node) {
      const entry = find((candidate) => candidate.config.element.contains(node))
      if (entry && entry.status !== 'built') finish(entry)
    },
    finishActive: () => active?.job?.finish(),
    finishAll: () => entries.forEach(finish),
    replay(id) {
      const target = pick(id)
      if (!target) return
      const rebuild = () => {
        hideSection(target.config.element)
        queue(target)
      }
      const running = active?.job
      if (!running) return rebuild()
      running.finish()
      void running.done.then(rebuild)
    },
    pick(id) {
      const entry = pick(id)
      return entry && { id: entry.config.id, element: entry.config.element, status: entry.status }
    },
    finish(id) {
      const entry = pick(id)
      if (entry) finish(entry)
    },
    hasActiveJob: () => active !== null,
    reset() {
      active?.job?.finish()
      if (waiting) waiting.status = 'pending'
      waiting = null
    },
  }
}
