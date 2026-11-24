import { describe, expect, it } from 'vitest'
import { hasStack, planStack, stackCardClass, stackedCardClass } from './project-stack'

describe('planStack', () => {
  it('shows every card when they fit', () => {
    const plan = planStack(4)
    expect(plan).toEqual({ compact: null, wide: null })
    expect(hasStack(plan)).toBe(false)
  })

  it('stacks on compact layouts first (6 projects = 5 regular cards)', () => {
    const plan = planStack(5)
    expect(plan).toEqual({ compact: 3, wide: null })
    expect(stackedCardClass(plan, 2)).toBe('')
    expect(stackedCardClass(plan, 3)).toBe('max-lg:hidden')
    // Wide layouts show every card, so the stack card hides there.
    expect(stackCardClass(plan)).toBe('lg:hidden')
  })

  it('stacks on every layout when there are many projects', () => {
    const plan = planStack(9)
    expect(plan).toEqual({ compact: 3, wide: 4 })
    expect(stackedCardClass(plan, 3)).toBe('max-lg:hidden')
    expect(stackedCardClass(plan, 4)).toBe('max-lg:hidden lg:hidden')
    expect(stackCardClass(plan)).toBe('')
  })
})
