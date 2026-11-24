import type { Bubbles } from './bubbles'
import type { Clock } from './clock'
import { crewIds } from './crew'
import { createCursorElement } from './cursor-element'
import { createCursorHandle, isVisible, setPosition, type PooledCursor } from './cursor-handle'
import type { CrewId, CursorHandle, Point } from './types'

// Job actions import the travel time from here.
export { cursorMoveMs } from './cursor-handle'

export interface ParkedCursor {
  id: CrewId
  position: Point
  busy: boolean
}

export interface CursorPool {
  /** For a job step: null when the cursor is held or the visible-cursor limit is reached. */
  acquire: (id: CrewId, signal: AbortSignal) => CursorHandle | null
  /** For reactions outside a job (docs/decisions/0005): bubbles count as reactions. */
  react: (id: CrewId, signal: AbortSignal) => CursorHandle
  /** The job ended: cursors stay parked where they are (ADR 0005). */
  idle: () => void
  hideAll: () => void
  /** Shows cursors hidden by hideAll again, where they were. */
  showAll: (ids: readonly CrewId[]) => void
  visible: () => ParkedCursor[]
  /** Which crew member a pointer event target belongs to. */
  crewAt: (node: EventTarget | null) => CrewId | null
  hold: (id: CrewId) => Point | null
  /** Moves a held cursor without animation (drag, flight). */
  place: (id: CrewId, point: Point) => void
  release: (id: CrewId) => void
  setDancing: (dancing: boolean) => void
  /** Shows the envelope the cursor carries out after the contact form is sent. */
  setCarrying: (id: CrewId, carrying: boolean) => void
  destroy: () => void
}

export interface CursorPoolOptions {
  maxVisible: number
  bubbles: Bubbles
}

export function createCursorPool(
  layer: HTMLElement,
  clock: Clock,
  { maxVisible, bubbles }: CursorPoolOptions,
): CursorPool {
  const cursors = new Map<CrewId, PooledCursor>()
  const visibleCount = () => [...cursors.values()].filter(isVisible).length

  function get(id: CrewId) {
    let cursor = cursors.get(id)
    if (!cursor) {
      cursor = { element: createCursorElement(id), position: null, busy: false, held: false }
      layer.append(cursor.element)
      cursors.set(id, cursor)
    }
    return cursor
  }

  const handle = (id: CrewId, signal: AbortSignal, reaction: boolean) =>
    createCursorHandle(id, get(id), { clock, bubbles }, signal, reaction)

  return {
    acquire(id, signal) {
      const cursor = get(id)
      if (cursor.held || (!isVisible(cursor) && visibleCount() >= maxVisible)) return null
      cursor.busy = true
      return handle(id, signal, false)
    },
    react: (id, signal) => handle(id, signal, true),
    idle: () => cursors.forEach((cursor) => (cursor.busy = false)),
    hideAll() {
      cursors.forEach((cursor) => delete cursor.element.dataset.visible)
    },
    showAll(ids) {
      ids.forEach((id) => {
        const cursor = cursors.get(id)
        if (cursor?.position) cursor.element.dataset.visible = 'true'
      })
    },
    visible: () =>
      [...cursors.entries()].flatMap(([id, cursor]) =>
        isVisible(cursor) && cursor.position && !cursor.held
          ? [{ id, position: cursor.position, busy: cursor.busy }]
          : [],
      ),
    crewAt(node) {
      if (!(node instanceof Element)) return null
      const id = node.closest<HTMLElement>('.build-cursor')?.dataset.crew
      return crewIds.find((crewId) => crewId === id) ?? null
    },
    hold(id) {
      const cursor = cursors.get(id)
      if (!cursor?.position || cursor.held) return null
      cursor.held = true
      cursor.element.dataset.held = 'true'
      return cursor.position
    },
    place(id, point) {
      const cursor = cursors.get(id)
      if (cursor) setPosition(cursor, point)
    },
    release(id) {
      const cursor = cursors.get(id)
      if (!cursor) return
      cursor.held = false
      delete cursor.element.dataset.held
    },
    setDancing(dancing) {
      cursors.forEach((cursor) => cursor.element.toggleAttribute('data-dancing', dancing))
    },
    setCarrying(id, carrying) {
      cursors.get(id)?.element.toggleAttribute('data-carrying', carrying)
    },
    destroy() {
      cursors.forEach((cursor) => cursor.element.remove())
      cursors.clear()
    },
  }
}
