import { useRef } from 'react'
import { copy } from '../../app/copy'
import { useYouCursor } from './use-you-cursor'

/** The visitor's own name tag. The system cursor stays visible; this only follows it. */
export function YouCursor() {
  const label = useRef<HTMLSpanElement>(null)
  useYouCursor(label)
  return (
    <span ref={label} aria-hidden="true" className="you-cursor">
      {copy.you}
    </span>
  )
}
