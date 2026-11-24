import type { BuildScript } from '../types'

/** Pixel selects a group and cannot resist nudging it; Bugsy drags another one in. */
export const skillsScript: BuildScript = [
  { by: 'kern', do: 'type', target: 'skills-title' },
  { by: 'pixel', do: 'select', target: 'skills-frontend', at: 0 },
  { by: 'pixel', do: 'nudge', target: 'skills-frontend', oops: true },
  { by: 'bugsy', do: 'drag', target: 'skills-backend', at: 0.3, mobile: false },
]
