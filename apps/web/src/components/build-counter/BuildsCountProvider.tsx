import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { useDirector } from '../../build/build-provider'
import { STORAGE_KEYS } from '../../build/config'
import type { Director } from '../../build/director'
import { api } from '../../lib/api'
import type { Result } from '../../lib/api-client'
import { readStorage, writeStorage } from '../../lib/storage'

const BuildsCountContext = createContext<number | null>(null)

/** The global "built N times" count; null until known or when the API is unavailable (hidden). */
export const useBuildsCount = () => use(BuildsCountContext)

/**
 * Calls `onBuilt` once, when this visit's first build job ends, or right away when building is off
 * (skipped, reduced motion). The director starts in its provider's effect, which runs after this
 * one, so the first check waits a task.
 */
function whenFirstBuildEnds(director: Director, onBuilt: () => void) {
  let wasBuilding = false
  let done = false
  const check = () => {
    const { mode, active } = director.getState()
    if (active) wasBuilding = true
    if (done || (mode === 'on' && (active || !wasBuilding))) return
    done = true
    unsubscribe()
    onBuilt()
  }
  const unsubscribe = director.subscribe(check)
  const timer = setTimeout(check)
  return () => {
    unsubscribe()
    clearTimeout(timer)
  }
}

export function BuildsCountProvider({ children }: { children: ReactNode }) {
  const director = useDirector()
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    const show = (result: Result<{ count: number }>) => {
      if (active) setCount(result.ok ? result.data.count : null)
    }
    // One count per tab session; reloads only read the number.
    if (readStorage('session', STORAGE_KEYS.counted)) {
      void api.builds().then(show)
      return () => void (active = false)
    }
    const stop = whenFirstBuildEnds(director, () => {
      writeStorage('session', STORAGE_KEYS.counted, 'true')
      void api.countBuild().then(show)
    })
    return () => {
      active = false
      stop()
    }
  }, [director])

  return <BuildsCountContext value={count}>{children}</BuildsCountContext>
}
