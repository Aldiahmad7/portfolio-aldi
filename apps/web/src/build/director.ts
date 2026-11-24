import { writeStorage } from '../lib/storage'
import { actions as defaultActions } from './actions'
import type { ClockDependencies } from './clock'
import { DEFAULT_SPEED, FAILSAFE_MS, STORAGE_KEYS, type Speed } from './config'
import type { CrewControl } from './crew-control'
import { claimSection } from './reveal'
import { rewindSection } from './rewind'
import { initialSpeed } from './initial-speed'
import { createRuntime, type Runtime } from './runtime'
import type { ActionDefinition, ActionName, BuildState, SectionConfig } from './types'
import { warnInvalidScript } from './warn-invalid-script'

export interface Director {
  /** Returns the unregister function. Works before and after start(). */
  register: (config: SectionConfig) => () => void
  start: () => void
  stop: () => void
  subscribe: (listener: () => void) => () => void
  getState: () => BuildState
  setSpeed: (speed: Speed) => void
  /** Shows everything now and turns building off for the rest of the visit. */
  skip: () => void
  replay: (id?: string) => void
  /** Ctrl+Z: unbuilds the given (or most visible) built section, then builds it again. */
  rewind: (id?: string) => boolean
  /** Redo: shows the given (or most visible) section at once. */
  finish: (id?: string) => boolean
  /** Crew reactions; null while building is off (skipped, reduced motion, prerender). */
  crew: () => CrewControl | null
}

export interface DirectorDependencies extends ClockDependencies {
  actions: Readonly<Record<ActionName, ActionDefinition>>
}

/** Set by the inline boot script in index.html when building should happen. */
const ROOT_PENDING = 'pending'

/** No React here: the director owns the build lifecycle; React registers sections and reads state. */
export function createDirector(dependencies: Partial<DirectorDependencies> = {}): Director {
  const actions = dependencies.actions ?? defaultActions
  const configs = new Map<string, SectionConfig>()
  const listeners = new Set<() => void>()
  let state: BuildState = { mode: 'off', active: null, progress: 0, speed: DEFAULT_SPEED }
  let runtime: Runtime | null = null
  let rewinding: AbortController | null = null

  const setState = (patch: Partial<BuildState>) => {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  }

  function attach({ page, sections }: Runtime, config: SectionConfig) {
    claimSection(config.element)
    sections.add(config)
    page.observe(config.element)
    if (import.meta.env.DEV) warnInvalidScript(config, actions)
  }

  function skip() {
    if (!runtime || state.mode !== 'on') return
    writeStorage('session', STORAGE_KEYS.skipped, 'true')
    rewinding?.abort()
    runtime.sections.finishAll()
    runtime.cursors.hideAll()
    delete document.documentElement.dataset.buildRoot
    setState({ mode: 'skipped' })
  }

  return {
    register(config) {
      configs.set(config.id, config)
      if (runtime && state.mode === 'on') attach(runtime, config)
      return () => {
        configs.delete(config.id)
        runtime?.sections.remove(config.id)
        runtime?.page.unobserve(config.element)
      }
    },

    start() {
      if (runtime) return
      const root = document.documentElement
      // Once the CSS failsafe has fired the content is visible; hiding it again would flash.
      if (root.dataset.buildRoot !== ROOT_PENDING || performance.now() > FAILSAFE_MS) {
        delete root.dataset.buildRoot
        return
      }
      const current = createRuntime({
        clock: dependencies,
        actions,
        onProgress: (progress) => setState({ progress }),
        onActiveChange: (active) => setState(active ? { active, progress: 0 } : { active }),
        onReducedMotion: skip,
      })
      runtime = current
      const speed = initialSpeed()
      current.clock.setSpeed(speed)
      setState({ mode: 'on', speed })
      configs.forEach((config) => attach(current, config))
    },

    stop() {
      if (!runtime) return
      rewinding?.abort()
      runtime.sections.reset()
      runtime.page.disconnect()
      runtime.stopGrabs()
      runtime.crew.destroy()
      runtime.cursors.destroy()
      runtime.layer.remove()
      runtime = null
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getState: () => state,

    setSpeed(speed) {
      runtime?.clock.setSpeed(speed)
      writeStorage('local', STORAGE_KEYS.speed, String(speed))
      setState({ speed })
    },

    skip,

    replay(id) {
      if (state.mode === 'on') runtime?.sections.replay(id)
    },

    rewind(id) {
      if (state.mode !== 'on' || !runtime) return false
      rewinding?.abort()
      rewinding = new AbortController()
      return rewindSection(runtime.sections, runtime.clock, id, rewinding.signal)
    },

    finish(id) {
      if (state.mode !== 'on' || !runtime) return false
      rewinding?.abort()
      runtime.sections.finish(id)
      return true
    },

    crew: () => (state.mode === 'on' ? (runtime?.crew ?? null) : null),
  }
}
