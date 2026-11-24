import { DEFAULT_SPEED, EASE, type Speed } from './config'

export type Animate = (
  element: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
) => Animation

export interface ClockDependencies {
  now: () => number
  animate: Animate
}

export interface Clock {
  readonly speed: Speed
  setSpeed: (speed: Speed) => void
  pause: () => void
  resume: () => void
  /** Resolves after `ms` of build time; rejects with the abort reason when `signal` aborts. */
  wait: (ms: number, signal: AbortSignal) => Promise<void>
  /** Runs a WAAPI animation without fill; callers set the end state on the element themselves. */
  play: (element: Element, keyframes: Keyframe[], ms: number, signal: AbortSignal) => Promise<void>
}

/** Something in flight that has to follow speed changes and pauses. */
interface Running {
  setSpeed: (speed: Speed) => void
  pause: () => void
  resume: () => void
}

const defaults: ClockDependencies = {
  now: () => performance.now(),
  animate: (element, keyframes, options) => element.animate(keyframes, options),
}

/**
 * Build time: speed scales every wait and animation, pause freezes them. One clock per director;
 * nothing runs (no rAF, no interval) while nothing is waiting.
 */
export function createClock(dependencies: Partial<ClockDependencies> = {}): Clock {
  const { now, animate } = { ...defaults, ...dependencies }
  const running = new Set<Running>()
  let speed: Speed = DEFAULT_SPEED
  let paused = false

  function track(signal: AbortSignal, entry: Running, onAbort: () => void) {
    const abort = () => onAbort()
    running.add(entry)
    signal.addEventListener('abort', abort, { once: true })
    return () => {
      running.delete(entry)
      signal.removeEventListener('abort', abort)
    }
  }

  function wait(ms: number, signal: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(signal.reason)
      let remaining = ms
      let rate: Speed = speed
      let startedAt = 0
      let timer: ReturnType<typeof setTimeout> | undefined
      const done = () => {
        untrack()
        resolve()
      }
      const start = () => {
        startedAt = now()
        timer = setTimeout(done, remaining / rate)
      }
      const stop = () => {
        clearTimeout(timer)
        remaining -= (now() - startedAt) * rate
      }
      const untrack = track(
        signal,
        {
          setSpeed: (next) => {
            if (!paused) stop()
            rate = next
            if (!paused) start()
          },
          pause: stop,
          resume: start,
        },
        () => {
          clearTimeout(timer)
          untrack()
          reject(signal.reason)
        },
      )
      if (!paused) start()
    })
  }

  function play(element: Element, keyframes: Keyframe[], ms: number, signal: AbortSignal) {
    if (signal.aborted) return Promise.reject(signal.reason)
    const animation = animate(element, keyframes, { duration: ms, easing: EASE })
    animation.playbackRate = speed
    if (paused) animation.pause()
    const untrack = track(
      signal,
      {
        setSpeed: (next) => animation.updatePlaybackRate(next),
        pause: () => animation.pause(),
        resume: () => animation.play(),
      },
      () => animation.cancel(),
    )
    return animation.finished.then(
      () => untrack(),
      (error: unknown) => {
        untrack()
        throw signal.aborted ? signal.reason : error
      },
    )
  }

  return {
    get speed() {
      return speed
    },
    setSpeed(next) {
      if (next === speed) return
      speed = next
      running.forEach((entry) => entry.setSpeed(next))
    },
    pause() {
      if (paused) return
      running.forEach((entry) => entry.pause())
      paused = true
    },
    resume() {
      if (!paused) return
      paused = false
      running.forEach((entry) => entry.resume())
    },
    wait,
    play,
  }
}
