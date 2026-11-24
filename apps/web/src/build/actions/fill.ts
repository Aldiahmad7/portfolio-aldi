import { CURSOR, FILL } from '../config'
import { crew } from '../crew'
import { cursorMoveMs } from '../cursor-pool'
import { placeOver } from '../overlay'
import type { ActionDefinition, Rect } from '../types'
import { centerOf } from './geometry'

/** Grows from the click point (the center) until it covers the corners. */
const SPREAD = [{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)' }]
const FADE_OUT = [{ opacity: 1 }, { opacity: 0 }]

/** Paint left behind by an oops fill (Red), waiting for the next fill on the same target to cover it. */
const leftovers = new WeakMap<HTMLElement, HTMLElement>()

function createPaint(target: HTMLElement, rect: Rect, color: string) {
  const paint = document.createElement('div')
  paint.className = 'build-fill'
  paint.style.setProperty('--crew-color', color)
  paint.style.borderRadius = getComputedStyle(target).borderRadius
  placeOver(paint, rect)
  return paint
}

/**
 * Paints the target in the crew member's color. With `oops` the paint stays on (Red's "trust me")
 * until another fill covers it; the job removes it in any case when it ends.
 */
export const fillAction: ActionDefinition = {
  duration: (step) =>
    cursorMoveMs(step.by) * (step.oops ? 2 : 1) +
    CURSOR.pressMs +
    FILL.spreadMs +
    (step.oops ? 0 : FILL.fadeMs),

  async run({ by, target, rect, cursor, overlay, play, reveal, oops }) {
    const click = centerOf(rect)
    await cursor.moveTo(click)
    await cursor.press()

    // A job that ended early already removed the leftover paint, so check that it is still there.
    const covered = leftovers.get(target)?.isConnected ? leftovers.get(target) : undefined
    cursor.say(covered ? 'notRed' : 'red')
    const paint = overlay.add(createPaint(target, rect, crew[by].color))
    await play(paint, SPREAD, FILL.spreadMs)
    reveal()
    covered?.remove()
    leftovers.delete(target)
    if (oops) {
      leftovers.set(target, paint)
      await cursor.moveTo({ x: click.x + FILL.stepBackPx, y: click.y + FILL.stepBackPx })
      return
    }
    paint.style.opacity = '0'
    await play(paint, FADE_OUT, FILL.fadeMs)
    paint.remove()
  },
}
