import { actions } from './actions'
import type { Animate } from './clock'
import type { ActionDefinition, ActionName } from './types'

export interface AnimateCall {
  element: Element
  keyframes: Keyframe[]
  duration: number
}

/**
 * jsdom has no Web Animations API. This stand-in finishes after `duration / playbackRate` on the
 * (fake) timers and supports the calls the clock makes. Use with vi.useFakeTimers().
 */
export function createFakeAnimate(now: () => number = () => Date.now()) {
  const calls: AnimateCall[] = []

  const animate: Animate = (element, keyframes, options) => {
    calls.push({ element, keyframes, duration: Number(options.duration) })
    let remaining = Number(options.duration)
    let rate = 1
    let startedAt = now()
    let timer: ReturnType<typeof setTimeout> | undefined
    let settle: { resolve: () => void; reject: (reason: unknown) => void } | undefined
    const finished = new Promise<void>((resolve, reject) => {
      settle = { resolve, reject }
    })

    const start = () => {
      startedAt = now()
      timer = setTimeout(() => settle?.resolve(), remaining / rate)
    }
    const stop = () => {
      clearTimeout(timer)
      remaining -= (now() - startedAt) * rate
    }
    const setRate = (next: number) => {
      stop()
      rate = next
      start()
    }
    start()

    const animation = {
      finished,
      get playbackRate() {
        return rate
      },
      set playbackRate(next: number) {
        setRate(next)
      },
      updatePlaybackRate: setRate,
      pause: stop,
      play: start,
      cancel() {
        clearTimeout(timer)
        settle?.reject(new DOMException('Animation cancelled', 'AbortError'))
      },
    }
    return animation as unknown as Animation
  }

  return { animate, calls }
}

/** Every action name mapped to `fallback`, with optional overrides (the registry type needs them all). */
export function actionRegistry(
  fallback: ActionDefinition,
  overrides: Partial<Record<ActionName, ActionDefinition>> = {},
): Record<ActionName, ActionDefinition> {
  const names = Object.keys(actions) as ActionName[]
  return { ...Object.fromEntries(names.map((name) => [name, fallback])), ...overrides } as Record<
    ActionName,
    ActionDefinition
  >
}
