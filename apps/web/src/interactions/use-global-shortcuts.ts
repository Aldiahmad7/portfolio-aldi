import { useEffect, useRef } from 'react'
import { matchShortcut, type ShortcutName } from './shortcuts'

/** Returns true when it handled the key; only then is the browser default prevented. */
export type ShortcutHandlers = Record<ShortcutName, () => boolean>

/** One keydown listener on window for every global shortcut. */
export function useGlobalShortcuts(handlers: ShortcutHandlers) {
  // Latest handlers without re-subscribing on every render.
  const latest = useRef(handlers)
  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const name = matchShortcut(event)
      if (name && latest.current[name]()) event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
