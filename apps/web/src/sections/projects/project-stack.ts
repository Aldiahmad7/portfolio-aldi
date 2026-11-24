/**
 * How many regular (non-featured) cards stay visible before the rest collapse into the stack card.
 * `capacity`: up to this many, every card shows and there is no stack. Above it, `shown` cards show
 * and the stack card takes the next slot, so the grid stays a clean rectangle:
 * - compact (1–2 columns): featured row + 3 cards + stack = two full rows of two;
 * - wide (lg, 3 columns): featured 2×2 + 4 cards + stack = 3 full rows.
 */
export const STACK_LIMITS = {
  compact: { capacity: 4, shown: 3 },
  wide: { capacity: 5, shown: 4 },
} as const

export type StackLayout = keyof typeof STACK_LIMITS

/** Cards shown per layout, or null when that layout shows every card. */
export type StackPlan = Record<StackLayout, number | null>

export function planStack(regularCount: number): StackPlan {
  const shownFor = (layout: StackLayout) => {
    const { capacity, shown } = STACK_LIMITS[layout]
    return regularCount > capacity ? shown : null
  }
  return { compact: shownFor('compact'), wide: shownFor('wide') }
}

const LAYOUT_HIDDEN_CLASS: Record<StackLayout, string> = {
  compact: 'max-lg:hidden',
  wide: 'lg:hidden',
}

/** Responsive classes that hide the regular card at `index` while the stack is collapsed. */
export function stackedCardClass(plan: StackPlan, index: number) {
  return (Object.keys(LAYOUT_HIDDEN_CLASS) as StackLayout[])
    .filter((layout) => {
      const shown = plan[layout]
      return shown !== null && index >= shown
    })
    .map((layout) => LAYOUT_HIDDEN_CLASS[layout])
    .join(' ')
}

/** Classes that hide the stack card itself in a layout that shows every card. */
export function stackCardClass(plan: StackPlan) {
  return (Object.keys(LAYOUT_HIDDEN_CLASS) as StackLayout[])
    .filter((layout) => plan[layout] === null)
    .map((layout) => LAYOUT_HIDDEN_CLASS[layout])
    .join(' ')
}

export const hasStack = (plan: StackPlan) => plan.compact !== null || plan.wide !== null
