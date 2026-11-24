/** Every number visitor interactions use (docs/interactions.md). Durations in milliseconds. */

export const POINTER_FINE_QUERY = '(pointer: fine)'

export const YOU_CURSOR = {
  /** Label offset from the pointer, so it sits beside the system cursor rather than under it. */
  offsetX: 14,
  offsetY: 18,
} as const

export const HELLO = {
  /** The pointer has to rest this long before a crew member comes over. */
  idleMs: 2000,
  cooldownMs: 20_000,
  /** The greeting cursor stops this far from the pointer. */
  distancePx: 60,
} as const

export const THROW = {
  /** Pointer samples used for the release velocity. */
  samples: 5,
  /** Share of speed kept after one second of flight. */
  frictionPerSecond: 0.08,
  /** Share of speed kept when bouncing off a viewport edge. */
  bounce: 0.6,
  maxSpeed: 3000,
  minSpeed: 40,
  /** Touch: a tap throws the cursor in a random direction at this speed. */
  tapSpeed: 1200,
  /** Longest frame step, so a background tab does not teleport the cursor. */
  maxFrameSeconds: 0.05,
  /**
   * A mouse press that moves less than this is a click, not a throw: it passes through to the page
   * (a parked cursor can sit on a button, ADR 0005).
   */
  clickMaxPx: 6,
} as const

export const BREAK_CARD = {
  /** Movement below this is a click and still opens the project. */
  dragThresholdPx: 6,
  restoreDelayMs: 600,
  restoreMs: 400,
  /** Touch: a press this long shoves the card instead of dragging (dragging would fight scrolling). */
  longPressMs: 500,
  shovePx: 40,
} as const

export const ENVELOPE = {
  /** Pixel shows the envelope at the send button for this long before leaving. */
  holdMs: 700,
  exitMs: 900,
  /** How far past the right edge of the viewport Pixel carries it. */
  exitPx: 80,
} as const

export const COMMANDS = {
  danceMs: 2000,
  redMs: 3000,
  coffeeMs: 5000,
  /** Intern is late back from the coffee break too. */
  internLateMs: 1200,
  maxSuggestions: 5,
  /** The command bar chunk loads when the browser is idle, or after this long at the latest. */
  preloadTimeoutMs: 3000,
} as const
