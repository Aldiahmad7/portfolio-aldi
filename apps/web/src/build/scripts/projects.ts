import type { BuildScript } from '../types'

/**
 * Red paints the featured card red and leaves it (oops); Pixel paints it back blue. Bugsy drops a
 * card upside down. Card targets are positional (project-featured, project-0…), never slugs, so
 * the script does not depend on content.
 */
export const projectsScript: BuildScript = [
  { by: 'kern', do: 'type', target: 'projects-title' },
  { by: 'pixel', do: 'select', target: 'project-0', at: 0 },
  { by: 'pixel', do: 'fill', target: 'project-featured', at: 0.75 },
  { by: 'red', do: 'fill', target: 'project-featured', oops: true, at: 0.1, mobile: false },
  { by: 'bugsy', do: 'drag', target: 'project-1', oops: true, at: 0.2, mobile: false },
]
