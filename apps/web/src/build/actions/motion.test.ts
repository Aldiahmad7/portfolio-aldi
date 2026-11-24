import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CURSOR, DRAG } from '../config'
import { dragAction } from './drag'
import { nudgeAction } from './nudge'
import { createTestContext, runForDuration } from './test-context'
import { visitAction } from './visit'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('drag', () => {
  it('shows the target off its spot, then carries it home', async () => {
    const { context, step, target, reveal } = createTestContext({ by: 'bugsy' })
    const running = dragAction.run(context)
    expect(reveal).toHaveBeenCalledOnce()
    expect(target.style.transform).toBe(`translate(${DRAG.offsetX}px, ${DRAG.offsetY}px)`)
    await vi.advanceTimersByTimeAsync(dragAction.duration(step, target))
    await running
    expect(target.style.transform).toBe('')
  })

  it('with oops, lands upside down, panics, flips back and says it is fine', async () => {
    const { context, step, target, say } = createTestContext({ by: 'bugsy', oops: true })
    const running = dragAction.run(context)
    await vi.advanceTimersByTimeAsync(CURSOR.moveMs + CURSOR.pressMs + DRAG.carryMs)
    expect(target.style.transform).toBe('rotate(180deg)')
    expect(say).toHaveBeenCalledWith('oops')
    await vi.advanceTimersByTimeAsync(DRAG.panicMs + DRAG.flipMs)
    await running
    expect(say).toHaveBeenLastCalledWith('fixed')
    expect(target.style.transform).toBe('')
    expect(dragAction.duration(step, target)).toBe(
      CURSOR.moveMs + CURSOR.pressMs + DRAG.carryMs + DRAG.panicMs + DRAG.flipMs,
    )
  })

  it('never leaves the target transformed when aborted mid-panic', async () => {
    const { context, target, controller } = createTestContext({ by: 'bugsy', oops: true })
    const running = dragAction.run(context)
    await vi.advanceTimersByTimeAsync(CURSOR.moveMs + CURSOR.pressMs + DRAG.carryMs + 10)
    controller.abort()
    await expect(running).rejects.toMatchObject({ name: 'AbortError' })
    expect(target.style.transform).toBe('')
  })
})

describe('nudge', () => {
  it.each([false, true])('moves the real target and settles back (oops: %s)', async (oops) => {
    const { context, step, target, reveal, calls } = createTestContext({ by: 'pixel', oops })
    await runForDuration(nudgeAction, context, step)
    expect(reveal).toHaveBeenCalledOnce()
    const keyframes = calls.find((call) => call.element === target)?.keyframes ?? []
    expect(keyframes).toHaveLength(oops ? 5 : 3)
    expect(keyframes.at(-1)).toEqual({ transform: 'none' })
  })
})

describe('visit', () => {
  it('is decorative and says it is late', async () => {
    const { context, step, say } = createTestContext({ by: 'intern' })
    await runForDuration(visitAction, context, step)
    expect(visitAction.decorative).toBe(true)
    expect(say).toHaveBeenCalledWith('late')
  })
})
