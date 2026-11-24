import { CURSOR, DRAW_RECT } from '../config'
import { cursorMoveMs } from '../cursor-pool'
import { placeOver } from '../overlay'
import type { ActionDefinition, Rect } from '../types'
import { inflate } from './geometry'

/** Drawn with clip-path rather than scale so the dashed border keeps its width while it grows. */
const GROW = [{ clipPath: 'inset(0 100% 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }]
const FADE_OUT = [{ opacity: 1 }, { opacity: 0 }]
const bottomRight = (rect: Rect) => ({ x: rect.x + rect.width, y: rect.y + rect.height })

export const drawRectAction: ActionDefinition = {
  duration: (step) =>
    cursorMoveMs(step.by) +
    CURSOR.pressMs +
    DRAW_RECT.drawMs +
    (step.oops ? DRAW_RECT.shrinkMs : 0) +
    DRAW_RECT.fadeMs,

  async run({ rect, cursor, overlay, play, reveal, oops }) {
    const drawn = oops ? inflate(rect, DRAW_RECT.oversizePx) : rect
    await cursor.moveTo({ x: drawn.x, y: drawn.y })
    await cursor.press()

    const box = document.createElement('div')
    box.className = 'build-rect'
    placeOver(box, drawn)
    overlay.add(box)
    await Promise.all([
      play(box, GROW, DRAW_RECT.drawMs),
      cursor.moveTo(bottomRight(drawn), DRAW_RECT.drawMs),
    ])
    if (oops) {
      // Too big: scale down to fit. The dashed border shrinks a little; at this size nobody notices.
      const fit = `scale(${rect.width / drawn.width}, ${rect.height / drawn.height})`
      box.style.transform = fit
      await Promise.all([
        play(box, [{ transform: 'none' }, { transform: fit }], DRAW_RECT.shrinkMs),
        cursor.moveTo(bottomRight(rect), DRAW_RECT.shrinkMs),
      ])
    }

    reveal()
    box.style.opacity = '0'
    await play(box, FADE_OUT, DRAW_RECT.fadeMs)
    box.remove()
  },
}
