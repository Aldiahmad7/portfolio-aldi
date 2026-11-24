import { describe, expect, it } from 'vitest'
import { buildTimeline } from './timeline'
import type { BuildStep } from './types'

const step = (overrides: Partial<BuildStep> = {}): BuildStep => ({
  by: 'pixel',
  do: 'drawRect',
  target: 'a',
  ...overrides,
})

describe('buildTimeline', () => {
  it('chains steps without `at` one after another', () => {
    const timeline = buildTimeline([step(), step(), step()], [100, 200, 300])
    expect(timeline.steps.map((scheduled) => scheduled.start)).toEqual([0, 100, 300])
    expect(timeline.total).toBe(600)
  })

  it('starts steps with `at` in parallel at an absolute time', () => {
    const timeline = buildTimeline([step(), step({ at: 0.1 })], [500, 100])
    expect(timeline.steps.map((scheduled) => scheduled.start)).toEqual([0, 100])
    expect(timeline.total).toBe(500)
  })

  it('chains a step without `at` after the previous step in array order', () => {
    const timeline = buildTimeline([step(), step({ at: 0.2 }), step()], [1000, 100, 100])
    expect(timeline.steps.map((scheduled) => scheduled.start)).toEqual([0, 200, 300])
    expect(timeline.total).toBe(1000)
  })

  it('returns an empty timeline for an empty script', () => {
    expect(buildTimeline([], [])).toEqual({ steps: [], total: 0 })
  })
})
