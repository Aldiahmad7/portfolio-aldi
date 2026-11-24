import { describe, expect, it } from 'vitest'
import { createTestDatabase } from '../test-utils'
import { incrementBuilds, readBuilds } from './builds'

describe('builds counter', () => {
  it('starts at zero and returns the new value on every increment', async () => {
    const { db } = createTestDatabase()
    expect(await readBuilds(db)).toBe(0)
    expect(await incrementBuilds(db)).toBe(1)
    expect(await incrementBuilds(db)).toBe(2)
    expect(await readBuilds(db)).toBe(2)
  })

  it('does not lose counts when increments run concurrently', async () => {
    const { db } = createTestDatabase()
    await Promise.all(Array.from({ length: 10 }, () => incrementBuilds(db)))
    expect(await readBuilds(db)).toBe(10)
  })
})
