import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CURSOR, DRAW_RECT, FILL } from '../config'
import type { ActionDefinition } from '../types'
import { drawRectAction } from './draw-rect'
import { fillAction } from './fill'
import { selectAction } from './select'
import { createTestContext, runForDuration } from './test-context'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe.each<[string, ActionDefinition]>([
  ['drawRect', drawRectAction],
  ['select', selectAction],
  ['fill', fillAction],
])('%s action', (_name, action) => {
  it.each([false, true])(
    'reveals the target and cleans up within its duration (oops: %s)',
    async (oops) => {
      const { context, step, layer, reveal } = createTestContext({ by: 'pixel', oops })
      await runForDuration(action, context, step)
      expect(reveal).toHaveBeenCalledOnce()
      // Only an oops fill leaves something behind on purpose; the job clears it.
      const leftovers = action === fillAction && oops ? 1 : 0
      expect(layer.children).toHaveLength(leftovers)
    },
  )
})

describe('drawRect', () => {
  it('takes longer with oops (overshoot, then shrink)', () => {
    const { context, step } = createTestContext({ by: 'pixel' })
    const plain = drawRectAction.duration(step, context.target)
    expect(plain).toBe(CURSOR.moveMs + CURSOR.pressMs + DRAW_RECT.drawMs + DRAW_RECT.fadeMs)
    expect(drawRectAction.duration({ ...step, oops: true }, context.target)).toBe(
      plain + DRAW_RECT.shrinkMs,
    )
  })
})

describe('fill', () => {
  it("paints in the crew member's color", async () => {
    const { context, step, layer } = createTestContext({ by: 'red', oops: true })
    await runForDuration(fillAction, context, step)
    expect(
      layer.querySelector<HTMLElement>('.build-fill')?.style.getPropertyValue('--crew-color'),
    ).toBe('var(--color-red)')
  })

  it('covers paint left by an oops fill and says it is not red', async () => {
    const red = createTestContext({ by: 'red', oops: true })
    await runForDuration(fillAction, red.context, red.step)
    expect(red.say).toHaveBeenCalledWith('red')

    const pixel = createTestContext({ by: 'pixel' })
    const context = { ...pixel.context, target: red.target, overlay: red.context.overlay }
    await runForDuration(fillAction, context, pixel.step)
    expect(pixel.say).toHaveBeenCalledWith('notRed')
    expect(red.layer.children).toHaveLength(0)
  })

  it('swaps the fade for a step back with oops', () => {
    const { context, step } = createTestContext({ by: 'red' })
    const plain = fillAction.duration(step, context.target)
    const oops = fillAction.duration({ ...step, oops: true }, context.target)
    expect(oops - plain).toBe(CURSOR.moveMs - FILL.fadeMs)
  })
})
