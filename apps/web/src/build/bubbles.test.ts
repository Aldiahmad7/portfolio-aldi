import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createBubbles } from './bubbles'
import { createClock } from './clock'
import { BUBBLE } from './config'
import { dialog } from './crew'
import { createFakeAnimate } from './test-utils'
import type { CrewId } from './types'

function setup({ enabled = true } = {}) {
  const clock = createClock({ now: () => Date.now(), animate: createFakeAnimate().animate })
  // random() = 0: first line, shortest cooldown.
  const bubbles = createBubbles({ clock, now: () => Date.now(), random: () => 0, enabled })
  const signal = new AbortController().signal
  const cursors = new Map<CrewId, HTMLElement>()
  const cursor = (id: CrewId) => {
    const element = cursors.get(id) ?? document.createElement('div')
    cursors.set(id, element)
    return element
  }
  const say = (id: CrewId, key: Parameters<typeof bubbles.show>[2], aborted = signal) =>
    bubbles.show(id, cursor(id), key, aborted)
  const shown = (id: CrewId) =>
    cursor(id).querySelector<HTMLElement>('.build-bubble[data-visible]')?.textContent ?? null
  return { clock, say, shown }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('bubbles', () => {
  it('shows a line from crew.ts and hides it after BUBBLE.showMs', async () => {
    const { say, shown } = setup()
    say('kern', 'typo')
    expect(shown('kern')).toBe(dialog.typo.kern?.[0])
    await vi.advanceTimersByTimeAsync(BUBBLE.showMs)
    expect(shown('kern')).toBeNull()
  })

  it('stays quiet for a character without lines for the key', () => {
    const { say, shown } = setup()
    say('pixel', 'typo')
    expect(shown('pixel')).toBeNull()
  })

  it('waits for the cooldown before the same cursor speaks again', async () => {
    const { say, shown } = setup()
    say('kern', 'typo')
    await vi.advanceTimersByTimeAsync(BUBBLE.showMs)
    say('kern', 'typo')
    expect(shown('kern')).toBeNull()
    await vi.advanceTimersByTimeAsync(BUBBLE.cooldownMinMs)
    say('kern', 'typo')
    expect(shown('kern')).not.toBeNull()
  })

  it(`keeps at most ${BUBBLE.maxOnScreen} bubbles on screen`, () => {
    const { say, shown } = setup()
    say('kern', 'greet')
    say('pixel', 'greet')
    say('bugsy', 'oops')
    expect(shown('bugsy')).toBeNull()
  })

  it('is silent at 3× and when disabled (mobile)', () => {
    const fast = setup()
    fast.clock.setSpeed(3)
    fast.say('kern', 'typo')
    expect(fast.shown('kern')).toBeNull()

    const mobile = setup({ enabled: false })
    mobile.say('kern', 'typo')
    expect(mobile.shown('kern')).toBeNull()
  })

  it('hides the bubble when the job is cut short', async () => {
    const { say, shown } = setup()
    const controller = new AbortController()
    say('kern', 'typo', controller.signal)
    controller.abort()
    await vi.advanceTimersByTimeAsync(0)
    expect(shown('kern')).toBeNull()
  })
})
