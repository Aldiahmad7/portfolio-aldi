import { describe, expect, it } from 'vitest'
import { THROW } from './config'
import { isResting, releaseVelocity, stepBody, tapVelocity, type Body } from './throw-physics'

const bounds = { left: 0, top: 0, right: 1000, bottom: 800 }

describe('releaseVelocity', () => {
  it('measures pixels per second over the recent samples', () => {
    const samples = [
      { x: 0, y: 0, time: 0 },
      { x: 50, y: 20, time: 100 },
    ]
    expect(releaseVelocity(samples)).toEqual({ vx: 500, vy: 200 })
  })

  it('caps the speed', () => {
    const { vx, vy } = releaseVelocity([
      { x: 0, y: 0, time: 0 },
      { x: 10_000, y: 0, time: 10 },
    ])
    expect(Math.hypot(vx, vy)).toBeCloseTo(THROW.maxSpeed)
  })

  it('is zero without movement over time', () => {
    expect(releaseVelocity([{ x: 1, y: 1, time: 5 }])).toEqual({ vx: 0, vy: 0 })
  })
})

describe('stepBody', () => {
  it('moves and slows down', () => {
    const next = stepBody({ x: 100, y: 100, vx: 400, vy: 0 }, 0.02, bounds)
    expect(next.x).toBeCloseTo(108)
    expect(next.vx).toBeLessThan(400)
  })

  it('bounces off an edge with less speed', () => {
    const next = stepBody({ x: 995, y: 100, vx: 800, vy: 0 }, 0.02, bounds)
    expect(next.x).toBe(bounds.right)
    expect(next.vx).toBeLessThan(0)
    expect(Math.abs(next.vx)).toBeLessThan(800 * THROW.bounce)
  })

  it('comes to rest eventually', () => {
    let body: Body = { x: 500, y: 400, vx: THROW.maxSpeed, vy: -THROW.maxSpeed / 2 }
    let frames = 0
    while (!isResting(body) && frames < 1000) {
      body = stepBody(body, 1 / 60, bounds)
      frames++
    }
    expect(isResting(body)).toBe(true)
    expect(body.x).toBeGreaterThanOrEqual(bounds.left)
    expect(body.x).toBeLessThanOrEqual(bounds.right)
  })
})

describe('tapVelocity', () => {
  it('throws at the tap speed', () => {
    const { vx, vy } = tapVelocity(() => 0.25)
    expect(Math.hypot(vx, vy)).toBeCloseTo(THROW.tapSpeed)
  })
})
