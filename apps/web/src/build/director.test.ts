import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SPEED, RETURNING_SPEED, STORAGE_KEYS } from './config'
import { createDirector } from './director'
import { actionRegistry, createFakeAnimate } from './test-utils'
import type { ActionDefinition, SectionConfig } from './types'

const STEP_MS = 100

class FakeIntersectionObserver {
  static current: FakeIntersectionObserver | null = null
  readonly observed = new Set<Element>()
  constructor(readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.current = this
  }
  observe(element: Element) {
    this.observed.add(element)
  }
  unobserve(element: Element) {
    this.observed.delete(element)
  }
  disconnect() {
    this.observed.clear()
  }
}

/** Simulates a section entering or leaving the build zone of the viewport. */
function intersect(element: Element, isIntersecting: boolean) {
  const observer = FakeIntersectionObserver.current
  observer?.callback(
    [{ target: element, isIntersecting } as IntersectionObserverEntry],
    observer as never,
  )
}

const waitAction: ActionDefinition = {
  duration: () => STEP_MS,
  run: (context) => context.wait(STEP_MS),
}

function section(id: string): SectionConfig {
  const element = document.createElement('section')
  element.innerHTML = `<p data-build="${id}-a"></p><p data-build="${id}-b"></p>`
  document.body.append(element)
  return {
    id,
    element,
    budget: 'default',
    script: [
      { by: 'kern', do: 'type', target: `${id}-a` },
      { by: 'kern', do: 'type', target: `${id}-b` },
    ],
  }
}

const isBuilt = (config: SectionConfig) =>
  [...config.element.querySelectorAll('[data-build]')].every((node) =>
    node.hasAttribute('data-built'),
  )

function setup() {
  const director = createDirector({
    now: () => Date.now(),
    animate: createFakeAnimate().animate,
    actions: actionRegistry(waitAction),
  })
  const hero = section('hero')
  const about = section('about')
  const projects = section('projects')
  ;[hero, about, projects].forEach((config) => director.register(config))
  return { director, hero, about, projects }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }))
  document.documentElement.dataset.buildRoot = 'pending'
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
  delete document.documentElement.dataset.buildRoot
  localStorage.clear()
  sessionStorage.clear()
})

describe('director', () => {
  it('stays off when the boot script did not mark the page as pending', () => {
    delete document.documentElement.dataset.buildRoot
    const { director, hero } = setup()
    director.start()
    expect(director.getState().mode).toBe('off')
    expect(hero.element.hasAttribute('data-build-claimed')).toBe(false)
  })

  it('stays off when the CSS failsafe has already shown the content', () => {
    vi.spyOn(performance, 'now').mockReturnValue(10_000)
    const { director } = setup()
    director.start()
    expect(director.getState().mode).toBe('off')
    expect(document.documentElement.dataset.buildRoot).toBeUndefined()
  })

  it('claims sections and builds one when it enters the viewport', async () => {
    const { director, hero } = setup()
    director.start()
    expect(hero.element.hasAttribute('data-build-claimed')).toBe(true)
    intersect(hero.element, true)
    expect(director.getState().active).toBe('hero')
    await vi.advanceTimersByTimeAsync(STEP_MS * 2)
    expect(isBuilt(hero)).toBe(true)
    expect(director.getState().active).toBeNull()
  })

  it('builds sections above a section that enters first at once', () => {
    const { director, hero, about, projects } = setup()
    director.start()
    intersect(projects.element, true)
    expect(isBuilt(hero) && isBuilt(about)).toBe(true)
    expect(director.getState().active).toBe('projects')
  })

  it('runs one job at a time and finishes a job that leaves the viewport', async () => {
    const { director, hero, about } = setup()
    director.start()
    intersect(hero.element, true)
    intersect(about.element, true)
    expect(director.getState().active).toBe('hero')
    intersect(hero.element, false)
    await vi.advanceTimersByTimeAsync(0)
    expect(isBuilt(hero)).toBe(true)
    expect(director.getState().active).toBe('about')
  })

  it('skips: reveals everything, turns off and remembers it for the visit', async () => {
    const { director, hero, about, projects } = setup()
    director.start()
    intersect(hero.element, true)
    director.skip()
    await vi.advanceTimersByTimeAsync(0)
    expect([hero, about, projects].every(isBuilt)).toBe(true)
    expect(director.getState().mode).toBe('skipped')
    expect(document.documentElement.dataset.buildRoot).toBeUndefined()
    expect(sessionStorage.getItem(STORAGE_KEYS.skipped)).toBe('true')
  })

  it('remembers the chosen speed', () => {
    const first = setup().director
    first.start()
    first.setSpeed(3)
    first.stop()
    const second = createDirector()
    second.start()
    expect(second.getState().speed).toBe(3)
    second.stop()
  })

  it('builds faster for returning visitors unless they chose a speed', () => {
    const first = setup().director
    first.start()
    expect(first.getState().speed).toBe(DEFAULT_SPEED)
    first.stop()
    const returning = createDirector()
    returning.start()
    expect(returning.getState().speed).toBe(RETURNING_SPEED)
    returning.setSpeed(1)
    returning.stop()
    const chosen = createDirector()
    chosen.start()
    expect(chosen.getState().speed).toBe(1)
    chosen.stop()
  })

  it('replays a built section', async () => {
    const { director, hero } = setup()
    director.start()
    intersect(hero.element, true)
    await vi.advanceTimersByTimeAsync(STEP_MS * 2)
    director.replay('hero')
    expect(isBuilt(hero)).toBe(false)
    expect(director.getState().active).toBe('hero')
    await vi.advanceTimersByTimeAsync(STEP_MS * 2)
    expect(isBuilt(hero)).toBe(true)
  })

  it('cleans up on stop: no layer, no observed sections, no timers', async () => {
    const { director, hero } = setup()
    director.start()
    intersect(hero.element, true)
    director.stop()
    await vi.advanceTimersByTimeAsync(0)
    expect(document.querySelector('.build-layer')).toBeNull()
    expect(FakeIntersectionObserver.current?.observed.size).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })
})
