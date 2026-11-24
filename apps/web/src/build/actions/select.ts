import { CURSOR, SELECT } from '../config'
import { cursorMoveMs } from '../cursor-pool'
import { placeOver } from '../overlay'
import type { ActionDefinition } from '../types'
import { centerOf, inflate } from './geometry'

const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const
const APPEAR = [{ opacity: 0 }, { opacity: 1 }]
const FADE_OUT = [{ opacity: 1 }, { opacity: 0 }]

function createSelection() {
  const box = document.createElement('div')
  box.className = 'build-select'
  CORNERS.forEach((corner) => {
    const handle = document.createElement('span')
    handle.className = 'build-select-handle'
    handle.dataset.corner = corner
    box.append(handle)
  })
  return box
}

/** A click selects the target the way a design tool does: box, corner handles, then it lets go. */
export const selectAction: ActionDefinition = {
  duration: (step) =>
    cursorMoveMs(step.by) + CURSOR.pressMs + SELECT.appearMs + SELECT.holdMs + SELECT.fadeMs,

  async run({ rect, cursor, overlay, play, wait, reveal }) {
    await cursor.moveTo(centerOf(rect))
    await cursor.press()

    const box = overlay.add(createSelection())
    placeOver(box, inflate(rect, SELECT.paddingPx))
    reveal()
    await play(box, APPEAR, SELECT.appearMs)
    await wait(SELECT.holdMs)
    box.style.opacity = '0'
    await play(box, FADE_OUT, SELECT.fadeMs)
    box.remove()
  },
}
