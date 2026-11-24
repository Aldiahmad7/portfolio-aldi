import { useEffect, useRef } from 'react'
import { useDirector } from './build-provider'
import type { BudgetName } from './config'
import type { BuildScript } from './types'

interface BuildOptions {
  id: string
  budget: BudgetName
}

/**
 * Registers a section with the director. Spread the result on the <section>: it sets the ref and
 * `data-build-section`, which is what makes the prerendered content hidden until it is built.
 * `script` must be a module-level constant so the effect does not re-run on every render.
 */
export function useBuild(script: BuildScript, { id, budget }: BuildOptions) {
  const director = useDirector()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    return director.register({ id, element, script, budget })
  }, [director, script, id, budget])

  return { ref, 'data-build-section': '' } as const
}
