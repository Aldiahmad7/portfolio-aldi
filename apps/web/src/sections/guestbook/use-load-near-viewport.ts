import { useEffect, useRef } from 'react'

/** Start loading a bit before the element scrolls into view, so the list is ready on arrival. */
const LOAD_MARGIN = '50% 0px'

/** Calls `load` once, when the element comes near the viewport. */
export function useLoadNearViewport<Element extends HTMLElement>(load: () => void) {
  const ref = useRef<Element>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    // Very old browsers (and jsdom) have no IntersectionObserver: just load.
    if (!('IntersectionObserver' in window)) return load()
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        load()
      },
      { rootMargin: LOAD_MARGIN },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [load])
  return ref
}
