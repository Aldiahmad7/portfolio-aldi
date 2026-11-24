import type { Bubbles } from './bubbles'
import type { Clock } from './clock'
import { CURSOR } from './config'
import { crew } from './crew'
import { translate } from './cursor-element'
import type { CrewId, CursorHandle, Point } from './types'

export const cursorMoveMs = (id: CrewId) => CURSOR.moveMs * crew[id].speedFactor

export interface PooledCursor {
  element: HTMLElement
  position: Point | null
  /** Running a step of the current job. */
  busy: boolean
  /** In the visitor's hand or in flight; jobs cannot use it. */
  held: boolean
}

export const isVisible = (cursor: PooledCursor) => cursor.element.dataset.visible !== undefined

export function setPosition(cursor: PooledCursor, point: Point) {
  cursor.position = point
  cursor.element.style.transform = translate(point)
}

/** What a job step or a reaction may do with one cursor; every animation obeys `signal`. */
export function createCursorHandle(
  id: CrewId,
  cursor: PooledCursor,
  { clock, bubbles }: { clock: Clock; bubbles: Bubbles },
  signal: AbortSignal,
  reaction: boolean,
): CursorHandle {
  return {
    async moveTo(point, ms = cursorMoveMs(id)) {
      // A hidden cursor enters from a short distance so the entrance still reads as movement.
      const from =
        isVisible(cursor) && cursor.position
          ? cursor.position
          : { x: point.x - CURSOR.entryOffsetPx, y: point.y - CURSOR.entryOffsetPx }
      cursor.element.dataset.visible = 'true'
      setPosition(cursor, point)
      const keyframes = [{ transform: translate(from) }, { transform: translate(point) }]
      await clock.play(cursor.element, keyframes, ms, signal)
    },
    async press() {
      const at = translate(cursor.position ?? { x: 0, y: 0 })
      const keyframes = [{ transform: at }, { transform: `${at} scale(0.85)` }, { transform: at }]
      await clock.play(cursor.element, keyframes, CURSOR.pressMs, signal)
    },
    say: (key) => bubbles.show(id, cursor.element, key, signal, reaction),
  }
}
