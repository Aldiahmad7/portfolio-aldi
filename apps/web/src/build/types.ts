import type { BudgetName, Speed } from './config'

export type CrewId = 'pixel' | 'kern' | 'bugsy' | 'intern' | 'red'
export type ActionName = 'type' | 'drawRect' | 'select' | 'drag' | 'fill' | 'nudge' | 'visit'
export type DialogKey =
  | 'greet'
  | 'typo'
  | 'oops'
  | 'fixed'
  | 'nudge'
  | 'red'
  | 'notRed'
  | 'late'
  | 'hello'
  | 'thrown'
  | 'restore'
  | 'unknownCommand'
  | 'envelope'

export interface BuildStep {
  by: CrewId
  do: ActionName
  /** Value of a data-build attribute inside the section. */
  target: string
  /** Seconds from build start at 1×. Without it the step starts when the previous step ends. */
  at?: number
  /** Fail first, then fix. Actions without an oops variant ignore it. */
  oops?: boolean
  /** Speech bubble when the step starts (lines live in crew.ts). */
  say?: DialogKey
  /** Skipped on mobile (max 2 cursors); its target is still revealed when the job ends. */
  mobile?: false
}
export type BuildScript = readonly BuildStep[]

/** Document coordinates (viewport + scroll), so decorations scroll with the page natively. */
export interface Point {
  x: number
  y: number
}
export interface Rect extends Point {
  width: number
  height: number
}

export interface CursorHandle {
  /** Travel time defaults to the character's cursor speed; pass `ms` to match another animation. */
  moveTo: (point: Point, ms?: number) => Promise<void>
  press: () => Promise<void>
  /** Shows a speech bubble if the bubble rules allow it; never blocks. */
  say: (key: DialogKey) => void
}

export interface Overlay {
  /** Adds a decoration element to the layer; it is removed when the job ends. */
  add: <T extends HTMLElement>(element: T) => T
}

export interface ActionContext {
  /** Crew member running the step. */
  by: CrewId
  /** The real element, still hidden. */
  target: HTMLElement
  /** Target position, measured once when the step starts. */
  rect: Rect
  cursor: CursorHandle
  overlay: Overlay
  /** Runs a WAAPI animation that follows speed, pause and abort. Set the end state yourself. */
  play: (element: Element, keyframes: Keyframe[], duration: number) => Promise<void>
  /** Waits on the build clock (speed, pause, abort apply). */
  wait: (ms: number) => Promise<void>
  /** Shows the real target. Idempotent. */
  reveal: () => void
  oops: boolean
  signal: AbortSignal
}

export interface ActionDefinition {
  /** Builds nothing (Intern's visit): left out of the budget and the progress bar. */
  decorative?: true
  /** Milliseconds at 1×, used for the timeline, progress and budget. */
  duration: (step: BuildStep, target: HTMLElement) => number
  run: (context: ActionContext) => Promise<void>
}

export interface SectionConfig {
  id: string
  element: HTMLElement
  script: BuildScript
  budget: BudgetName
}

export type BuildMode = 'off' | 'on' | 'skipped'

/** Immutable snapshot for the HUD (useSyncExternalStore). */
export interface BuildState {
  mode: BuildMode
  /** Section currently building, if any. */
  active: string | null
  /** 0–1 for the active job. */
  progress: number
  speed: Speed
}
