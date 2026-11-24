import { CURSOR, DRAG } from '../config'
import { cursorMoveMs } from '../cursor-pool'
import type { ActionDefinition } from '../types'
import { centerOf, translate } from './geometry'

const DISPLACED = translate(DRAG.offsetX, DRAG.offsetY)
const UPSIDE_DOWN = 'rotate(180deg)'
const oopsMs = (oops: boolean) => (oops ? DRAG.panicMs + DRAG.flipMs : 0)

/**
 * The target appears off its spot and is carried into place. Only `transform` animates; the inline
 * transform held while Bugsy panics is always removed, even when the job is cut short.
 */
export const dragAction: ActionDefinition = {
  duration: (step) =>
    cursorMoveMs(step.by) + CURSOR.pressMs + DRAG.carryMs + oopsMs(step.oops ?? false),

  async run({ target, rect, cursor, play, wait, reveal, oops }) {
    const home = centerOf(rect)
    const grab = { x: home.x + DRAG.offsetX, y: home.y + DRAG.offsetY }
    try {
      target.style.transform = DISPLACED
      reveal()
      await cursor.moveTo(grab)
      await cursor.press()

      const landing = oops ? UPSIDE_DOWN : 'none'
      target.style.transform = landing
      await Promise.all([
        play(target, [{ transform: DISPLACED }, { transform: landing }], DRAG.carryMs),
        cursor.moveTo(home, DRAG.carryMs),
      ])
      if (!oops) return

      cursor.say('oops')
      await wait(DRAG.panicMs)
      target.style.transform = 'none'
      await play(target, [{ transform: UPSIDE_DOWN }, { transform: 'none' }], DRAG.flipMs)
      cursor.say('fixed')
    } finally {
      target.style.removeProperty('transform')
    }
  },
}
