import { useEffect, useState } from 'react'

/**
 * A thin line across the viewport, just above the middle: the section crossing it is "current".
 * Sections are taller than half the screen, so exactly one crosses it at a time.
 */
const READING_LINE = '-45% 0px -55% 0px'

/** Id of the section the visitor is reading, or null (e.g. still on the hero). */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    // jsdom and very old browsers: no highlight, the links still work.
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
          else setActive((current) => (current === entry.target.id ? null : current))
        }
      },
      { rootMargin: READING_LINE },
    )
    for (const id of ids) {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [ids])
  return active
}
