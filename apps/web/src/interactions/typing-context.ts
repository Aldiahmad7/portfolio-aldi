const TYPING_SELECTOR = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

/**
 * True when a key press belongs to whatever the visitor is typing into: global shortcuts must then
 * do nothing and never call preventDefault (docs/interactions.md §2).
 */
export function isTypingContext(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  if (target.closest(TYPING_SELECTOR)) return true
  const dialog = target.closest('dialog')
  return dialog?.open === true && dialog.querySelector('form') !== null
}
