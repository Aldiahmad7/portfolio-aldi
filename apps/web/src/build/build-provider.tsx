import {
  createContext,
  use,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { DEFAULT_SPEED } from './config'
import { createDirector, type Director } from './director'
import type { BuildState } from './types'

const DirectorContext = createContext<Director | null>(null)

/** Prerendered HTML has no build state; the HUD appears after hydration. */
const serverState: BuildState = { mode: 'off', active: null, progress: 0, speed: DEFAULT_SPEED }

interface BuildProviderProps {
  children: ReactNode
  /** Tests pass their own director. */
  director?: Director
}

export function BuildProvider({ children, director: injected }: BuildProviderProps) {
  // createDirector touches no browser API, so this is safe during prerender.
  const [director] = useState(() => injected ?? createDirector())
  // Child effects (section registration) run before this one, so start() sees every section.
  useEffect(() => {
    director.start()
    return () => director.stop()
  }, [director])
  return <DirectorContext value={director}>{children}</DirectorContext>
}

export function useDirector(): Director {
  const director = use(DirectorContext)
  if (!director) throw new Error('useDirector must be used inside <BuildProvider>')
  return director
}

/** Re-renders only the components that read build state (the HUD), not the sections. */
export function useBuildState(): BuildState {
  const director = useDirector()
  return useSyncExternalStore(director.subscribe, director.getState, () => serverState)
}
