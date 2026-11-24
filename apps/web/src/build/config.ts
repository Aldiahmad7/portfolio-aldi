/** Every number the build engine uses. Durations are milliseconds at 1× speed. */

export const SPEEDS = [1, 2, 3] as const
export type Speed = (typeof SPEEDS)[number]
export const DEFAULT_SPEED: Speed = 1
/** Second and later visits build faster unless the visitor picked a speed (OQ-07, product-spec F13). */
export const RETURNING_SPEED: Speed = 3

/** Same curve as --ease-standard in styles/tokens.css. */
export const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export const BUDGET_MS = {
  hero: 3000,
  default: 1500,
} as const
export type BudgetName = keyof typeof BUDGET_MS

export const CURSOR = {
  /** Travel time to the next point. */
  moveMs: 180,
  /** Click "press" feedback. */
  pressMs: 80,
  /** Cursors start this far up-left of their first target so the entrance reads as movement. */
  entryOffsetPx: 48,
  maxDesktop: 6,
  maxMobile: 2,
} as const

export const TYPE = {
  charMs: 28,
  /** Longer text types this many characters (cut at a word) and "pastes" the rest. */
  maxChars: 24,
  pasteMs: 160,
  /** Oops: two swapped characters, a beat to notice, then backspace. */
  typoChars: 2,
  typoPauseMs: 150,
  backspaceMs: 20,
} as const

export const DRAW_RECT = {
  drawMs: 420,
  fadeMs: 150,
  /** Oops: the box overshoots by this much on every side, then shrinks to fit. */
  oversizePx: 24,
  shrinkMs: 200,
} as const

export const SELECT = {
  /** The selection box sits this far outside the target. */
  paddingPx: 4,
  appearMs: 120,
  holdMs: 160,
  fadeMs: 120,
} as const

export const DRAG = {
  /** Where the target starts before it is dragged into place. */
  offsetX: -72,
  offsetY: 40,
  carryMs: 380,
  /** Oops: lands upside down, a beat of panic, then flips back. */
  panicMs: 260,
  flipMs: 240,
} as const

export const FILL = {
  spreadMs: 240,
  fadeMs: 120,
  /** Oops: Red steps back to admire the paint, which also clears the spot for the next cursor. */
  stepBackPx: 56,
} as const

export const NUDGE = {
  distancePx: 3,
  shiftMs: 140,
  /** Oops: one extra shift in the wrong direction first. */
  wrongShiftMs: 140,
} as const

export const VISIT = {
  lingerMs: 900,
  /** Intern wanders off this far before the cursors fade out. */
  leavePx: 120,
} as const

export const BUBBLE = {
  showMs: 1800,
  /** Random pause per cursor between bubbles. */
  cooldownMinMs: 4000,
  cooldownMaxMs: 8000,
  maxOnScreen: 2,
  /** At this speed or faster routine bubbles stay off (docs/crew.md §3). */
  quietSpeed: 3,
} as const

/** Ctrl+Z: built targets disappear one by one in reverse order within this time, then the section rebuilds. */
export const REWIND_MS = 500

/** A section starts building once its top is this share of the viewport height above the bottom edge. */
export const ENTER_VIEWPORT_SHARE = 0.3
export const RESIZE_DEBOUNCE_MS = 150
export const HUD_IDLE_HIDE_MS = 1000

/**
 * Must match --build-failsafe-delay in styles/build.css: after this long, CSS shows hidden content
 * on its own, so a section claimed later is treated as already built instead of hiding it again.
 */
export const FAILSAFE_MS = 5000

/** Must match the inline boot script in index.html (checked by boot-script.test.ts). */
export const STORAGE_KEYS = {
  speed: 'cursor-crew:speed',
  skipped: 'cursor-crew:skipped',
  /** This tab already added its build to the global counter (docs/product-spec.md F10). */
  counted: 'cursor-crew:counted',
  /** Set on the first visit; later visits default to RETURNING_SPEED. */
  visited: 'cursor-crew:visited',
} as const

export const MOBILE_QUERY = '(max-width: 47.99rem)'
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
