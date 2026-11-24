import type { BuildScript } from '../types'

/** Red tries to make the submit button red; without oops the paint fades, so the attempt fails. */
export const contactScript: BuildScript = [
  { by: 'pixel', do: 'drawRect', target: 'contact-form' },
  { by: 'kern', do: 'type', target: 'contact-title', at: 0 },
  { by: 'red', do: 'fill', target: 'contact-submit', at: 0.85, mobile: false },
]
