import { COMMANDS, ENVELOPE, HELLO } from '../interactions/config'
import type { Clock } from './clock'
import type { CursorPool } from './cursor-pool'
import type { CrewId, CursorHandle, DialogKey, Point } from './types'

export interface CrewControl {
  /** The nearest parked, idle cursor comes over to the visitor's pointer and says hello. */
  greet: (pointer: Point) => void
  /** Moves a crew member to `point` (document coordinates) and says `key`. */
  react: (id: CrewId, point: Point, key: DialogKey) => Promise<void>
  /** Pixel carries the sent contact message (an envelope) from `from` out of the page and back. */
  deliver: (from: Point) => Promise<void>
  /** Stops whatever reaction the cursor was doing (it was grabbed). */
  interrupt: (id: CrewId) => void
  dance: () => void
  coffeeBreak: () => void
  destroy: () => void
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

/** Crew reactions outside build jobs (docs/decisions/0005). Everything runs on the build clock. */
export function createCrewControl(cursors: CursorPool, clock: Clock): CrewControl {
  const lifetime = new AbortController()
  const reactions = new Map<CrewId, AbortController>()

  function interrupt(id: CrewId) {
    reactions.get(id)?.abort()
    reactions.delete(id)
  }

  /** Runs one reaction; a new reaction, a grab or teardown aborts the previous one. */
  async function perform(
    id: CrewId,
    task: (cursor: CursorHandle, signal: AbortSignal) => Promise<void>,
  ) {
    interrupt(id)
    const controller = new AbortController()
    reactions.set(id, controller)
    const signal = AbortSignal.any([controller.signal, lifetime.signal])
    try {
      await task(cursors.react(id, signal), signal)
    } catch {
      // Interrupted (grabbed, another reaction, page torn down): nothing to clean up.
    } finally {
      if (reactions.get(id) === controller) reactions.delete(id)
    }
  }

  const react = (id: CrewId, point: Point, key: DialogKey) =>
    perform(id, async (cursor) => {
      await cursor.moveTo(point)
      cursor.say(key)
    })

  const deliver = (from: Point) =>
    perform('pixel', async (cursor, signal) => {
      await cursor.moveTo(from)
      cursor.say('envelope')
      cursors.setCarrying('pixel', true)
      try {
        await clock.wait(ENVELOPE.holdMs, signal)
        const outside = { x: window.scrollX + window.innerWidth + ENVELOPE.exitPx, y: from.y }
        await cursor.moveTo(outside, ENVELOPE.exitMs)
      } finally {
        cursors.setCarrying('pixel', false)
      }
      await cursor.moveTo(from, ENVELOPE.exitMs)
    })

  /** Waits on the build clock; resolves false if the control was destroyed meanwhile. */
  const pause = (ms: number) =>
    clock.wait(ms, lifetime.signal).then(
      () => true,
      () => false,
    )

  return {
    greet(pointer) {
      const nearest = cursors
        .visible()
        .filter((cursor) => !cursor.busy && !reactions.has(cursor.id))
        .sort((a, b) => distance(a.position, pointer) - distance(b.position, pointer))[0]
      if (!nearest) return
      const spot = { x: pointer.x + HELLO.distancePx, y: pointer.y + HELLO.distancePx }
      void react(nearest.id, spot, 'hello')
    },
    react,
    deliver,
    interrupt,
    dance() {
      cursors.setDancing(true)
      void pause(COMMANDS.danceMs).then(() => cursors.setDancing(false))
    },
    coffeeBreak() {
      const away = cursors.visible().map((cursor) => cursor.id)
      cursors.hideAll()
      void (async () => {
        if (!(await pause(COMMANDS.coffeeMs))) return
        cursors.showAll(away.filter((id) => id !== 'intern'))
        if (await pause(COMMANDS.internLateMs)) cursors.showAll(away)
      })()
    },
    destroy: () => lifetime.abort(),
  }
}
