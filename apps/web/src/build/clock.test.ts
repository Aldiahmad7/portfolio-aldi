import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClock } from './clock'
import { createFakeAnimate } from './test-utils'

function setup() {
  const fake = createFakeAnimate()
  const clock = createClock({ now: () => Date.now(), animate: fake.animate })
  const controller = new AbortController()
  return { clock, controller, fake }
}

/** Flags when the promise settles, so tests can check timing without awaiting it. */
function settled(promise: Promise<unknown>) {
  const state = { done: false }
  promise.then(
    () => (state.done = true),
    () => (state.done = true),
  )
  return state
}

async function advance(ms: number) {
  await vi.advanceTimersByTimeAsync(ms)
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('clock.wait', () => {
  it('resolves after the given build time at 1×', async () => {
    const { clock, controller } = setup()
    const state = settled(clock.wait(300, controller.signal))
    await advance(299)
    expect(state.done).toBe(false)
    await advance(1)
    expect(state.done).toBe(true)
  })

  it('runs faster at a higher speed', async () => {
    const { clock, controller } = setup()
    clock.setSpeed(3)
    const state = settled(clock.wait(300, controller.signal))
    await advance(100)
    expect(state.done).toBe(true)
  })

  it('keeps elapsed time when the speed changes midway', async () => {
    const { clock, controller } = setup()
    const state = settled(clock.wait(400, controller.signal))
    await advance(200)
    clock.setSpeed(2)
    await advance(99)
    expect(state.done).toBe(false)
    await advance(1)
    expect(state.done).toBe(true)
  })

  it('freezes while paused', async () => {
    const { clock, controller } = setup()
    const state = settled(clock.wait(200, controller.signal))
    await advance(100)
    clock.pause()
    await advance(1000)
    expect(state.done).toBe(false)
    clock.resume()
    await advance(100)
    expect(state.done).toBe(true)
  })

  it('rejects with the abort reason and stops the timer', async () => {
    const { clock, controller } = setup()
    const promise = clock.wait(200, controller.signal)
    controller.abort()
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('rejects at once when the signal is already aborted', async () => {
    const { clock, controller } = setup()
    controller.abort()
    await expect(clock.wait(200, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('clock.play', () => {
  it('starts animations at the current speed and follows speed changes', async () => {
    const { clock, controller } = setup()
    clock.setSpeed(2)
    const element = document.createElement('div')
    const state = settled(
      clock.play(element, [{ opacity: 0 }, { opacity: 1 }], 400, controller.signal),
    )
    await advance(200)
    expect(state.done).toBe(true)
  })

  it('cancels the animation on abort', async () => {
    const { clock, controller } = setup()
    const promise = clock.play(document.createElement('div'), [], 400, controller.signal)
    controller.abort()
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    expect(vi.getTimerCount()).toBe(0)
  })
})
