import { CURSOR, NUDGE } from '../config'
import { cursorMoveMs } from '../cursor-pool'
import type { ActionDefinition } from '../types'
import { centerOf, translate } from './geometry'

const AT_REST = { transform: 'none' }
const shifted = (direction: 1 | -1) => ({ transform: translate(NUDGE.distancePx * direction, 0) })

const shiftMs = (oops: boolean) => NUDGE.shiftMs + (oops ? NUDGE.wrongShiftMs : 0)

/**
 * Pixel's finishing touch: the target moves a few pixels and settles back. The real element only
 * animates `transform` without fill, so it always ends exactly where layout put it.
 */
export const nudgeAction: ActionDefinition = {
  duration: (step) => cursorMoveMs(step.by) + CURSOR.pressMs + shiftMs(step.oops ?? false),

  async run({ target, rect, cursor, play, reveal, oops }) {
    await cursor.moveTo(centerOf(rect))
    await cursor.press()
    reveal()
    cursor.say('nudge')
    const keyframes = oops
      ? [AT_REST, shifted(-1), AT_REST, shifted(1), AT_REST]
      : [AT_REST, shifted(1), AT_REST]
    await play(target, keyframes, shiftMs(oops))
  },
}
