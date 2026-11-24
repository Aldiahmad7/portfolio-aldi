import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClock } from './clock'
import { createCursorPool } from './cursor-pool'
import { runJob, type JobDependencies } from './job'
import { createLayer } from './overlay'
import { actionRegistry, createFakeAnimate } from './test-utils'
import type { ActionDefinition, BuildScript } from './types'

const STEP_MS = 100

function setup(script: BuildScript, overrides: Partial<JobDependencies> = {}) {
  const ran: string[] = []
  const recordingAction: ActionDefinition = {
    duration: () => STEP_MS,
    async run(context) {
      ran.push(context.target.dataset.build ?? '')
      context.overlay.add(document.createElement('div'))
      await context.wait(STEP_MS)
      context.reveal()
    },
  }
  const failingAction: ActionDefinition = {
    duration: () => STEP_MS,
    run: async () => {
      throw new Error('boom')
    },
  }
  const element = document.createElement('section')
  element.innerHTML = '<p data-build="a"></p><p data-build="b"></p><p data-build="extra"></p>'
  document.body.append(element)
  const clock = createClock({ now: () => Date.now(), animate: createFakeAnimate().animate })
  const layer = createLayer()
  const progress: number[] = []
  const show = vi.fn()
  const job = runJob(
    { id: 'test', element, script, budget: 'default' },
    {
      clock,
      layer,
      cursors: createCursorPool(layer, clock, { maxVisible: 6, bubbles: { show } }),
      actions: actionRegistry(recordingAction, {
        drawRect: failingAction,
        visit: { ...recordingAction, decorative: true },
      }),
      isMobile: false,
      onProgress: (value) => progress.push(value),
      ...overrides,
    },
  )
  const built = () =>
    [...element.querySelectorAll('[data-built]')].map((node) => node.getAttribute('data-build'))
  return { job, ran, built, layer, progress, show }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('runJob', () => {
  it('runs steps in order and reveals every target, including unscripted ones', async () => {
    const { job, ran, built, layer, progress } = setup([
      { by: 'kern', do: 'type', target: 'a' },
      { by: 'pixel', do: 'type', target: 'b' },
    ])
    await vi.advanceTimersByTimeAsync(STEP_MS)
    expect(ran).toEqual(['a', 'b'])
    expect(built()).toEqual(['a'])
    await vi.advanceTimersByTimeAsync(STEP_MS)
    await job.done
    expect(built()).toEqual(['a', 'b', 'extra'])
    expect(layer.querySelectorAll('div:not(.build-cursor)')).toHaveLength(0)
    expect(progress).toEqual([0, 0.5, 1, 1])
  })

  it('reveals the target of a failing action and continues', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { job, ran, built } = setup([
      { by: 'pixel', do: 'drawRect', target: 'a' },
      { by: 'pixel', do: 'type', target: 'b' },
    ])
    await vi.advanceTimersByTimeAsync(0)
    expect(built()).toEqual(['a'])
    await vi.advanceTimersByTimeAsync(STEP_MS)
    await job.done
    expect(ran).toEqual(['b'])
  })

  it('stops running steps on finish and still reveals everything', async () => {
    const { job, ran, built } = setup([
      { by: 'kern', do: 'type', target: 'a' },
      { by: 'kern', do: 'type', target: 'b' },
    ])
    await vi.advanceTimersByTimeAsync(STEP_MS / 2)
    job.finish()
    await job.done
    expect(ran).toEqual(['a'])
    expect(built()).toEqual(['a', 'b', 'extra'])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('skips `mobile: false` steps on mobile', async () => {
    const { job, ran } = setup(
      [
        { by: 'kern', do: 'type', target: 'a', mobile: false },
        { by: 'kern', do: 'type', target: 'b' },
      ],
      { isMobile: true },
    )
    await vi.advanceTimersByTimeAsync(STEP_MS)
    await job.done
    expect(ran).toEqual(['b'])
  })

  it('skips invalid steps silently', async () => {
    const { job, ran } = setup([
      { by: 'kern', do: 'type', target: 'missing' },
      { by: 'kern', do: 'type', target: 'a' },
    ])
    await vi.advanceTimersByTimeAsync(STEP_MS)
    await job.done
    expect(ran).toEqual(['a'])
  })

  it('shows the step bubble when the step starts', async () => {
    const { job, show } = setup([{ by: 'kern', do: 'type', target: 'a', say: 'greet' }])
    await vi.advanceTimersByTimeAsync(0)
    expect(show).toHaveBeenCalledWith(
      'kern',
      expect.any(HTMLElement),
      'greet',
      expect.anything(),
      false,
    )
    await vi.advanceTimersByTimeAsync(STEP_MS)
    await job.done
  })

  it('fills the progress bar before a decorative step ends', async () => {
    const { job, progress } = setup([
      { by: 'kern', do: 'type', target: 'a' },
      { by: 'intern', do: 'visit', target: 'a' },
    ])
    await vi.advanceTimersByTimeAsync(STEP_MS)
    expect(progress.at(-1)).toBe(1)
    await vi.advanceTimersByTimeAsync(STEP_MS)
    await job.done
  })
})
