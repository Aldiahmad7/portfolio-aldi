import { ENTER_VIEWPORT_SHARE, REDUCED_MOTION_QUERY, RESIZE_DEBOUNCE_MS } from './config'

export interface PageSignalHandlers {
  /** A section came into (or left) the build zone of the viewport. */
  onIntersect: (element: Element, isInside: boolean) => void
  onHiddenChange: (hidden: boolean) => void
  /** Width changed (height-only changes are mobile URL bars and are ignored). */
  onResize: () => void
  onFocusIn: (target: Node) => void
  onReducedMotion: () => void
}

export interface PageSignals {
  observe: (element: Element) => void
  unobserve: (element: Element) => void
  disconnect: () => void
}

/** Every browser listener the director needs, in one place so one call removes them all. */
export function watchPage(handlers: PageSignalHandlers): PageSignals {
  const listeners = new AbortController()
  const { signal } = listeners
  // One observer for all sections; the bottom margin means "top has passed this share of the viewport".
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => handlers.onIntersect(entry.target, entry.isIntersecting)),
    { rootMargin: `0px 0px -${ENTER_VIEWPORT_SHARE * 100}% 0px` },
  )

  document.addEventListener('visibilitychange', () => handlers.onHiddenChange(document.hidden), {
    signal,
  })
  document.addEventListener(
    'focusin',
    (event) => {
      if (event.target instanceof Node) handlers.onFocusIn(event.target)
    },
    { signal },
  )

  let width = window.innerWidth
  let resizeTimer: ReturnType<typeof setTimeout> | undefined
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (window.innerWidth === width) return
        width = window.innerWidth
        handlers.onResize()
      }, RESIZE_DEBOUNCE_MS)
    },
    { signal, passive: true },
  )

  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY)
  reducedMotion.addEventListener(
    'change',
    () => {
      if (reducedMotion.matches) handlers.onReducedMotion()
    },
    { signal },
  )

  return {
    observe: (element) => observer.observe(element),
    unobserve: (element) => observer.unobserve(element),
    disconnect() {
      observer.disconnect()
      listeners.abort()
      clearTimeout(resizeTimer)
    },
  }
}
