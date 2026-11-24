import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClock } from './clock'
import { REWIND_MS } from './config'
import { rewindSection } from './rewind'
import type { SectionQueue, Status } from './section-queue'
import { createFakeAnimate } from './test-utils'

function setup({ status = 'built' as Status, activeJob = false } = {}) {
  const element = document.createElement('section')
  element.innerHTML = '<p data-build="a" data-built></p><p data-build="b" data-built></p>'
  const replay = vi.fn()
  const sections = {
    pick: () => ({ id: 'about', element, status }),
    hasActiveJob: () => activeJob,
    replay,
  } as Partial<SectionQueue> as SectionQueue
  const clock = createClock({ now: () => Date.now(), animate: createFakeAnimate().animate })
  const built = () =>
    [...element.querySelectorAll('[data-built]')].map((node) => node.getAttribute('data-build'))
  return { sections, clock, replay, built }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('rewindSection', () => {
  it('hides targets last first, then rebuilds the section', async () => {
    const { sections, clock, replay, built } = setup()
    expect(rewindSection(sections, clock, undefined, new AbortController().signal)).toBe(true)
    expect(built()).toEqual(['a'])
    await vi.advanceTimersByTimeAsync(REWIND_MS)
    expect(built()).toEqual([])
    expect(replay).toHaveBeenCalledWith('about')
  })

  it('does nothing while a job runs or when the section is not built', () => {
    const signal = new AbortController().signal
    const running = setup({ activeJob: true })
    expect(rewindSection(running.sections, running.clock, undefined, signal)).toBe(false)
    const pending = setup({ status: 'pending' })
    expect(rewindSection(pending.sections, pending.clock, undefined, signal)).toBe(false)
  })

  it('does not rebuild when aborted (redo or skip took over)', async () => {
    const { sections, clock, replay } = setup()
    const controller = new AbortController()
    rewindSection(sections, clock, undefined, controller.signal)
    controller.abort()
    await vi.advanceTimersByTimeAsync(REWIND_MS)
    expect(replay).not.toHaveBeenCalled()
  })
})
