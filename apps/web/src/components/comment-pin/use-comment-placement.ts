import { SECTION_IDS } from '@cursor-crew/shared/limits'
import { useEffect, useRef } from 'react'
import type { CommentTarget } from './use-comment-form'

/** Marks pins, popovers and the mode banner: clicks there never place a new pin. */
export const COMMENT_UI_ATTRIBUTE = 'data-comment-ui'
const PERCENT = 100
/** Positions are stored with one decimal (docs/interactions.md §7). */
const PRECISION = 10

const percent = (offset: number, size: number) =>
  Math.round(Math.min(PERCENT, Math.max(0, (offset / size) * PERCENT)) * PRECISION) / PRECISION

/** Where in which section a click landed, or null outside the commentable sections. */
export function targetAt(event: MouseEvent): CommentTarget | null {
  if (!(event.target instanceof Element)) return null
  if (event.target.closest(`[${COMMENT_UI_ATTRIBUTE}]`)) return null
  const section = event.target.closest('main section[id]')
  const id = SECTION_IDS.find((sectionId) => sectionId === section?.id)
  if (!section || !id) return null
  const box = section.getBoundingClientRect()
  return {
    section: id,
    x: percent(event.clientX - box.left, box.width),
    y: percent(event.clientY - box.top, box.height),
  }
}

interface PlacementHandlers {
  onPlace: (target: CommentTarget) => void
  /** Esc: the layer closes its topmost part (draft, open pin, then the mode itself). */
  onEscape: () => void
}

/**
 * While comment mode is on: sections get an outline, a click in a section places a pin instead of
 * doing what it normally does (links, cards), and Esc steps back.
 */
export function useCommentPlacement(handlers: PlacementHandlers) {
  const latest = useRef(handlers)
  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    const root = document.documentElement
    root.dataset.commentMode = ''
    const listeners = new AbortController()
    const { signal } = listeners
    // Capture on document runs before React's root listener, so the page's own click never fires.
    document.addEventListener(
      'click',
      (event) => {
        const target = targetAt(event)
        if (!target) return
        event.preventDefault()
        event.stopPropagation()
        latest.current.onPlace(target)
      },
      { capture: true, signal },
    )
    window.addEventListener(
      'keydown',
      (event) => {
        // A modal (project details, command bar) handles its own Esc first.
        if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return
        event.preventDefault()
        latest.current.onEscape()
      },
      { signal },
    )
    return () => {
      listeners.abort()
      delete root.dataset.commentMode
    }
  }, [])
}
