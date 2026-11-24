import type { BuildScript } from '../types'

/**
 * Three tracks. Kern types the text (one typo in the name), Pixel outlines the card and finishes
 * with a 1px nudge, Bugsy drags the meta line in upside down (desktop only). Steps without `at`
 * chain after the step before them, so each track is listed in order. The avatar is the LCP
 * element and prerendered as built (OQ-04); Pixel selects it so Replay rebuilds it early.
 */
export const heroScript: BuildScript = [
  { by: 'kern', do: 'type', target: 'hero-title', oops: true },
  { by: 'kern', do: 'type', target: 'hero-role' },
  { by: 'kern', do: 'type', target: 'hero-tagline' },
  { by: 'pixel', do: 'drawRect', target: 'hero-card', at: 0.1, say: 'greet' },
  { by: 'pixel', do: 'select', target: 'hero-avatar' },
  { by: 'pixel', do: 'drawRect', target: 'hero-actions' },
  { by: 'pixel', do: 'nudge', target: 'hero-card' },
  { by: 'bugsy', do: 'drag', target: 'hero-meta', oops: true, at: 1.4, mobile: false },
]
