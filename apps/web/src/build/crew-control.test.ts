import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COMMANDS, ENVELOPE, HELLO } from '../interactions/config'
import { createClock } from './clock'
import { CURSOR } from './config'
import { createCrewControl } from './crew-control'
import { createCursorPool } from './cursor-pool'
import { createFakeAnimate } from './test-utils'
import type { CrewId } from './types'

function setup() {
  const clock = createClock({ now: () => Date.now(), animate: createFakeAnimate().animate })
  const layer = document.createElement('div')
  document.body.append(layer)
  const show = vi.fn()
  const cursors = createCursorPool(layer, clock, { maxVisible: 6, bubbles: { show } })
  const crew = createCrewControl(cursors, clock)
  const signal = new AbortController().signal
  /** Parks a cursor as if a job had just used it. */
  const park = async (id: CrewId, x: number, y: number) => {
    const moving = cursors.acquire(id, signal)?.moveTo({ x, y })
    await vi.advanceTimersByTimeAsync(CURSOR.moveMs * 2)
    await moving
  }
  const visibleIds = () => cursors.visible().map((cursor) => cursor.id)
  return { crew, cursors, show, park, visibleIds }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('crew control', () => {
  it('sends the nearest idle cursor to greet the visitor', async () => {
    const { crew, cursors, show, park } = setup()
    await park('kern', 0, 0)
    await park('pixel', 500, 500)
    cursors.idle()
    crew.greet({ x: 450, y: 450 })
    await vi.advanceTimersByTimeAsync(CURSOR.moveMs)
    expect(show).toHaveBeenLastCalledWith(
      'pixel',
      expect.any(HTMLElement),
      'hello',
      expect.anything(),
      true,
    )
    const pixel = cursors.visible().find((cursor) => cursor.id === 'pixel')
    expect(pixel?.position).toEqual({ x: 450 + HELLO.distancePx, y: 450 + HELLO.distancePx })
  })

  it('does not send a busy cursor', async () => {
    const { crew, show, park } = setup()
    await park('kern', 0, 0)
    crew.greet({ x: 10, y: 10 })
    await vi.advanceTimersByTimeAsync(CURSOR.moveMs)
    expect(show).not.toHaveBeenCalled()
  })

  it('takes a coffee break and Intern comes back last', async () => {
    const { crew, cursors, park, visibleIds } = setup()
    await park('kern', 0, 0)
    await park('intern', 10, 10)
    cursors.idle()
    crew.coffeeBreak()
    expect(visibleIds()).toEqual([])
    await vi.advanceTimersByTimeAsync(COMMANDS.coffeeMs)
    expect(visibleIds()).toEqual(['kern'])
    await vi.advanceTimersByTimeAsync(COMMANDS.internLateMs)
    expect(visibleIds()).toEqual(['kern', 'intern'])
  })

  it('dances for a limited time', async () => {
    const { crew, park } = setup()
    await park('kern', 0, 0)
    crew.dance()
    expect(document.querySelector('[data-dancing]')).not.toBeNull()
    await vi.advanceTimersByTimeAsync(COMMANDS.danceMs)
    expect(document.querySelector('[data-dancing]')).toBeNull()
  })

  it('stops pending reactions when destroyed', async () => {
    const { crew, cursors, park, visibleIds } = setup()
    await park('kern', 0, 0)
    cursors.idle()
    crew.coffeeBreak()
    crew.destroy()
    await vi.advanceTimersByTimeAsync(COMMANDS.coffeeMs + COMMANDS.internLateMs)
    expect(visibleIds()).toEqual([])
  })
})

describe('cursor pool', () => {
  it('keeps cursors parked after a job and refuses held cursors to jobs', async () => {
    const { cursors, park, visibleIds } = setup()
    await park('kern', 0, 0)
    cursors.idle()
    expect(visibleIds()).toEqual(['kern'])
    expect(cursors.hold('kern')).toEqual({ x: 0, y: 0 })
    expect(cursors.acquire('kern', new AbortController().signal)).toBeNull()
    cursors.release('kern')
    expect(cursors.acquire('kern', new AbortController().signal)).not.toBeNull()
  })

  it('delivers the envelope: Pixel says it, carries it out of the page and comes back', async () => {
    const { crew, show } = setup()
    const pixel = () => document.querySelector<HTMLElement>('.build-cursor[data-crew="pixel"]')
    const delivered = crew.deliver({ x: 300, y: 400 })
    await vi.advanceTimersByTimeAsync(CURSOR.moveMs)
    expect(show).toHaveBeenLastCalledWith(
      'pixel',
      expect.any(HTMLElement),
      'envelope',
      expect.anything(),
      true,
    )
    expect(pixel()?.hasAttribute('data-carrying')).toBe(true)
    await vi.advanceTimersByTimeAsync(ENVELOPE.holdMs + ENVELOPE.exitMs)
    expect(pixel()?.hasAttribute('data-carrying')).toBe(false)
    await vi.advanceTimersByTimeAsync(ENVELOPE.exitMs)
    await delivered
    expect(pixel()?.style.transform).toBe('translate(300px, 400px)')
  })
})
