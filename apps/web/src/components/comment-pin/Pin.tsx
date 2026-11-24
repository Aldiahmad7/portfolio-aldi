import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { CommentTarget } from './use-comment-form'
import { COMMENT_UI_ATTRIBUTE } from './use-comment-placement'

/** Pins in the right part of a section open their popover to the left, so it stays on screen. */
const FLIP_AT_PERCENT = 60

interface PinProps {
  target: CommentTarget
  label: string
  initial: string
  open: boolean
  onToggle?: () => void
  /** Popover content, shown while open. */
  children: ReactNode
}

/** A comment pin inside its section (positioned in % of the section box) with its popover. */
export function Pin({ target, label, initial, open, onToggle, children }: PinProps) {
  const section = document.getElementById(target.section)
  if (!section) return null
  const side = target.x > FLIP_AT_PERCENT ? 'right-8' : 'left-8'
  return createPortal(
    <div
      {...{ [COMMENT_UI_ATTRIBUTE]: '' }}
      className="absolute z-40"
      style={{ left: `${target.x}%`, top: `${target.y}%` }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={onToggle}
        className="grid size-7 -translate-y-full place-items-center rounded-pill rounded-bl-none border-2 border-bg bg-accent font-mono text-xs font-bold text-bg shadow-hud"
      >
        {initial}
      </button>
      {open && (
        <div
          // Phones: a panel above the HUD instead, since a popover beside the pin would not fit.
          className={`absolute top-0 ${side} w-[min(20rem,calc(100vw-2*var(--spacing-gutter)))] -translate-y-full rounded-md border border-border bg-surface p-4 text-sm shadow-hud max-sm:fixed max-sm:inset-x-gutter max-sm:top-auto max-sm:bottom-20 max-sm:w-auto max-sm:translate-y-0`}
        >
          {children}
        </div>
      )}
    </div>,
    section,
  )
}
