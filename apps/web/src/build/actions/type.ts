import { TYPE } from '../config'
import { cursorMoveMs } from '../cursor-pool'
import { placeOver } from '../overlay'
import type { ActionDefinition, Rect } from '../types'

/** Inherited text styles a shallow clone would lose once it leaves its parent. */
const INHERITED_TEXT_STYLES = ['font', 'color', 'letterSpacing', 'lineHeight', 'textAlign'] as const

const textOf = (target: HTMLElement) => (target.textContent ?? '').replace(/\s+/g, ' ').trim()

/** Characters typed one by one; long text is cut at a word and the rest is "pasted". */
export function typedLength(text: string) {
  if (text.length <= TYPE.maxChars) return text.length
  const lastSpace = text.lastIndexOf(' ', TYPE.maxChars)
  return lastSpace > 0 ? lastSpace : TYPE.maxChars
}

/** Where the oops typo happens (half way), or null when the typed part is too short for one. */
function typoAt(typed: number) {
  const at = Math.floor(typed / 2)
  return typed - at >= TYPE.typoChars ? at : null
}

const typoMs = (oops: boolean, typed: number) =>
  oops && typoAt(typed) !== null
    ? TYPE.typoChars * (TYPE.charMs + TYPE.backspaceMs) + TYPE.typoPauseMs
    : 0

/** Same tag, classes and box as the target, so the typed text lands exactly where the real text is. */
function createClone(target: HTMLElement, rect: Rect) {
  const clone = target.cloneNode(false) as HTMLElement
  clone.removeAttribute('id')
  clone.removeAttribute('data-build')
  clone.classList.add('build-clone')
  const computed = getComputedStyle(target)
  INHERITED_TEXT_STYLES.forEach((property) => (clone.style[property] = computed[property]))
  placeOver(clone, rect)
  return clone
}

async function typeOut(
  content: Text,
  before: string,
  extra: string,
  wait: (ms: number) => Promise<void>,
) {
  for (let count = 1; count <= extra.length; count++) {
    content.data = before + extra.slice(0, count)
    await wait(TYPE.charMs)
  }
}

export const typeAction: ActionDefinition = {
  duration(step, target) {
    const text = textOf(target)
    const typed = typedLength(text)
    const paste = typed < text.length ? TYPE.pasteMs : 0
    return cursorMoveMs(step.by) + typed * TYPE.charMs + paste + typoMs(step.oops ?? false, typed)
  },

  async run({ target, rect, cursor, overlay, wait, reveal, oops }) {
    const text = textOf(target)
    const typed = typedLength(text)
    // Bottom-left, so the cursor label sits under the text instead of covering it.
    await cursor.moveTo({ x: rect.x, y: rect.y + rect.height })

    const clone = overlay.add(createClone(target, rect))
    const content = document.createTextNode('')
    const caret = document.createElement('span')
    caret.className = 'build-caret'
    clone.replaceChildren(content, caret)

    const typo = oops ? typoAt(typed) : null
    for (let index = 1; index <= typed; index++) {
      if (index - 1 === typo) {
        // Swapped letters, a beat to notice, then backspace: the classic kerning-guy typo.
        const swapped = [...text.slice(typo, typo + TYPE.typoChars)].reverse().join('')
        await typeOut(content, text.slice(0, typo), swapped, wait)
        cursor.say('typo')
        await wait(TYPE.typoPauseMs)
        for (let left = TYPE.typoChars - 1; left >= 0; left--) {
          content.data = text.slice(0, typo) + swapped.slice(0, left)
          await wait(TYPE.backspaceMs)
        }
      }
      content.data = text.slice(0, index)
      await wait(TYPE.charMs)
    }
    if (typed < text.length) {
      content.data = text
      clone.dataset.pasted = 'true'
      await wait(TYPE.pasteMs)
    }
    reveal()
    clone.remove()
  },
}
