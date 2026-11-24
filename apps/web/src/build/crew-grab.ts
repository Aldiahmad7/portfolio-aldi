import { THROW } from '../interactions/config'
import {
  isResting,
  releaseVelocity,
  stepBody,
  tapVelocity,
  type Body,
  type Sample,
} from '../interactions/throw-physics'
import type { CrewControl } from './crew-control'
import type { CursorPool } from './cursor-pool'
import type { CrewId, Point } from './types'

export interface GrabOptions {
  layer: HTMLElement
  cursors: CursorPool
  crew: CrewControl
  /** The grabbed cursor was working: finish its section so the build cannot break. */
  onGrabBusy: () => void
  random: () => number
}

const MS_PER_SECOND = 1000

const viewportBounds = () => ({
  left: window.scrollX,
  top: window.scrollY,
  right: window.scrollX + window.innerWidth,
  bottom: window.scrollY + window.innerHeight,
})

/** What a click on a parked cursor should reach instead. */
const INTERACTIVE = 'a[href], button, input, select, textarea, label, summary, [tabindex]'

/** The interactive element under the cursor's hitbox, or null. */
function elementBelow(hitbox: HTMLElement, event: PointerEvent): HTMLElement | null {
  hitbox.style.pointerEvents = 'none'
  const below = document.elementFromPoint(event.clientX, event.clientY)
  hitbox.style.pointerEvents = ''
  return below?.closest<HTMLElement>(INTERACTIVE) ?? null
}

const pagePoint = (event: PointerEvent): Point => ({
  x: event.clientX + window.scrollX,
  y: event.clientY + window.scrollY,
})

/**
 * Catch and throw (docs/interactions.md §4). Mouse/pen: drag, release with velocity. Touch: a tap
 * throws in a random direction, so it never fights page scrolling. rAF runs only during a flight.
 */
export function watchGrabs({ layer, cursors, crew, onGrabBusy, random }: GrabOptions) {
  const listeners = new AbortController()
  const frames = new Set<number>()

  function land(id: CrewId, home: Point) {
    cursors.release(id)
    void crew.react(id, home, 'thrown')
  }

  function fly(id: CrewId, start: Body, home: Point) {
    let body = start
    let last = performance.now()
    const frame = (now: number) => {
      frames.delete(handle)
      body = stepBody(body, (now - last) / MS_PER_SECOND, viewportBounds())
      last = now
      cursors.place(id, body)
      if (isResting(body)) return land(id, home)
      handle = requestAnimationFrame(frame)
      frames.add(handle)
    }
    let handle = requestAnimationFrame(frame)
    frames.add(handle)
  }

  function grab(event: PointerEvent) {
    const hitbox = event.target
    const id = cursors.crewAt(hitbox)
    if (!id || !(hitbox instanceof HTMLElement)) return
    const busy = cursors.visible().some((cursor) => cursor.id === id && cursor.busy)
    crew.interrupt(id)
    const home = cursors.hold(id)
    if (!home) return
    event.preventDefault()
    if (busy) onGrabBusy()

    if (event.pointerType === 'touch') return fly(id, { ...home, ...tapVelocity(random) }, home)

    hitbox.setPointerCapture(event.pointerId)
    const offset = { x: home.x - pagePoint(event).x, y: home.y - pagePoint(event).y }
    const samples: Sample[] = []
    const move = (moveEvent: PointerEvent) => {
      const point = pagePoint(moveEvent)
      samples.push({ ...point, time: moveEvent.timeStamp })
      if (samples.length > THROW.samples) samples.shift()
      cursors.place(id, { x: point.x + offset.x, y: point.y + offset.y })
    }
    const drop = (upEvent: PointerEvent) => {
      hitbox.removeEventListener('pointermove', move)
      const travelled = Math.hypot(upEvent.clientX - event.clientX, upEvent.clientY - event.clientY)
      if (upEvent.type === 'pointerup' && travelled < THROW.clickMaxPx) return clickThrough(upEvent)
      const point = pagePoint(upEvent)
      fly(id, { x: point.x + offset.x, y: point.y + offset.y, ...releaseVelocity(samples) }, home)
    }
    // A click, not a throw: the cursor stays put and the click reaches the button or link below.
    const clickThrough = (upEvent: PointerEvent) => {
      cursors.place(id, home)
      cursors.release(id)
      const target = elementBelow(hitbox, upEvent)
      target?.focus({ preventScroll: true })
      target?.click()
    }
    hitbox.addEventListener('pointermove', move, { signal: listeners.signal })
    hitbox.addEventListener('pointerup', drop, { once: true, signal: listeners.signal })
    hitbox.addEventListener('pointercancel', drop, { once: true, signal: listeners.signal })
  }

  layer.addEventListener('pointerdown', grab, { signal: listeners.signal })
  return () => {
    listeners.abort()
    frames.forEach((handle) => cancelAnimationFrame(handle))
    frames.clear()
  }
}
