import type { BuildScript } from '../types'

/** Pixel frames the photo and selects the bio, Kern types the titles, Intern turns up late. */
export const aboutScript: BuildScript = [
  { by: 'kern', do: 'type', target: 'about-title' },
  { by: 'kern', do: 'type', target: 'about-experience-title' },
  { by: 'pixel', do: 'drawRect', target: 'about-photo', at: 0 },
  { by: 'pixel', do: 'select', target: 'about-bio' },
  { by: 'bugsy', do: 'drag', target: 'about-job-0', at: 0.35, mobile: false },
  { by: 'intern', do: 'visit', target: 'about-photo', at: 1.5, mobile: false },
]
