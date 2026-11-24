import type { BuildScript } from '../types'

/** Pixel draws the board too big and shrinks it to fit. */
export const guestbookScript: BuildScript = [
  { by: 'kern', do: 'type', target: 'guestbook-title' },
  { by: 'kern', do: 'type', target: 'guestbook-intro' },
  { by: 'pixel', do: 'drawRect', target: 'guestbook-board', oops: true, at: 0.1 },
]
