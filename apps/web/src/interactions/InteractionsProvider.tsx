import {
  createContext,
  lazy,
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useDirector } from '../build/build-provider'
import { REDUCED_MOTION_QUERY } from '../build/config'
import { YouCursor } from '../components/you-cursor/YouCursor'
import { useMediaQuery } from '../hooks/use-media-query'
import { COMMANDS, POINTER_FINE_QUERY } from './config'
import { useGlobalShortcuts } from './use-global-shortcuts'

const loadCommandBar = () => import('../components/command-bar/CommandBar')
const CommandBar = lazy(loadCommandBar)
// Its own chunk: loaded the first time comment mode turns on (C or the HUD button).
const CommentLayer = lazy(() => import('../components/comment-pin/CommentLayer'))

const OpenCommandBarContext = createContext<(() => void) | null>(null)
const CommentModeContext = createContext<{ active: boolean; toggle: () => void } | null>(null)

/** The HUD button uses this; null outside the provider (then the button is not shown). */
export const useOpenCommandBar = () => use(OpenCommandBarContext)
/** Comment mode for the HUD toggle; null outside the provider. */
export const useCommentMode = () => use(CommentModeContext)

/** Global shortcuts, the "You" label, the lazily loaded command bar and comment mode. */
export function InteractionsProvider({ children }: { children: ReactNode }) {
  const director = useDirector()
  // Each request opens the bar; a counter (not a boolean) so a request right after Esc is never lost.
  const [openRequests, setOpenRequests] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const openBar = useCallback(() => setOpenRequests((count) => count + 1), [])
  const [commenting, setCommenting] = useState(false)
  const toggleComments = useCallback(() => setCommenting((active) => !active), [])
  const exitComments = useCallback(() => setCommenting(false), [])
  const commentMode = useMemo(
    () => ({ active: commenting, toggle: toggleComments }),
    [commenting, toggleComments],
  )
  const finePointer = useMediaQuery(POINTER_FINE_QUERY)
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)

  // Out of the initial bundle, but fetched and mounted (closed) once the page is idle, so the first
  // "/" opens it in the same frame instead of dropping the keys typed while it loads.
  useEffect(() => {
    const preload = () => void loadCommandBar().then(() => setLoaded(true))
    if ('requestIdleCallback' in window) {
      const handle = requestIdleCallback(preload, { timeout: COMMANDS.preloadTimeoutMs })
      return () => cancelIdleCallback(handle)
    }
    const timer = setTimeout(preload, COMMANDS.preloadTimeoutMs)
    return () => clearTimeout(timer)
  }, [])

  useGlobalShortcuts({
    commandBar: () => {
      openBar()
      return true
    },
    undo: () => director.rewind(),
    redo: () => director.finish(),
    comments: () => {
      toggleComments()
      // A plain letter key has no browser default worth preventing (docs/interactions.md §2).
      return false
    },
  })

  return (
    <OpenCommandBarContext value={openBar}>
      <CommentModeContext value={commentMode}>{children}</CommentModeContext>
      {finePointer && !reducedMotion && <YouCursor />}
      {(loaded || openRequests > 0) && (
        <Suspense fallback={null}>
          <CommandBar openRequests={openRequests} />
        </Suspense>
      )}
      {commenting && (
        <Suspense fallback={null}>
          <CommentLayer onExit={exitComments} />
        </Suspense>
      )}
    </OpenCommandBarContext>
  )
}
