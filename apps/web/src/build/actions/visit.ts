import { VISIT } from '../config'
import { cursorMoveMs } from '../cursor-pool'
import type { ActionDefinition } from '../types'
import { centerOf } from './geometry'

/**
 * Intern shows up once the work is done, looks around and wanders off. Builds nothing, so it is
 * decorative: the budget and the progress bar ignore it.
 */
export const visitAction: ActionDefinition = {
  decorative: true,
  duration: (step) => cursorMoveMs(step.by) * 2 + VISIT.lingerMs,

  async run({ rect, cursor, wait, reveal }) {
    reveal()
    const spot = centerOf(rect)
    await cursor.moveTo(spot)
    cursor.say('late')
    await wait(VISIT.lingerMs)
    await cursor.moveTo({ x: spot.x + VISIT.leavePx, y: spot.y + VISIT.leavePx })
  },
}
