import { isTypingContext } from './typing-context'

export type ShortcutName = 'commandBar' | 'undo' | 'redo' | 'comments'

interface Shortcut {
  name: ShortcutName
  key: string
  /** Ctrl on Windows/Linux, ⌘ on macOS. */
  mod: boolean
  shift: boolean
}

/** The whole table (docs/interactions.md §2). Ctrl+Y is redo on Windows even without Shift. */
const SHORTCUTS: readonly Shortcut[] = [
  { name: 'commandBar', key: '/', mod: false, shift: false },
  { name: 'commandBar', key: 'k', mod: true, shift: false },
  { name: 'undo', key: 'z', mod: true, shift: false },
  { name: 'redo', key: 'z', mod: true, shift: true },
  { name: 'redo', key: 'y', mod: true, shift: false },
  { name: 'comments', key: 'c', mod: false, shift: false },
]

/** Which shortcut a key press is, or null (also null inside inputs and while composing text). */
export function matchShortcut(event: KeyboardEvent): ShortcutName | null {
  if (event.isComposing || event.altKey || isTypingContext(event.target)) return null
  const mod = event.ctrlKey || event.metaKey
  const key = event.key.toLowerCase()
  const match = SHORTCUTS.find(
    (shortcut) => shortcut.key === key && shortcut.mod === mod && shortcut.shift === event.shiftKey,
  )
  return match?.name ?? null
}
