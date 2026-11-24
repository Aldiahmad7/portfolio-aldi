import { useEffect, type RefObject } from 'react'
import { useDirector } from '../../build/build-provider'
import { HELLO, YOU_CURSOR } from '../../interactions/config'

/**
 * Moves the "You" label with the pointer: pointermove only stores the position, one rAF writes the
 * transform, and nothing runs while the pointer rests. A rest of HELLO.idleMs may bring a crew
 * member over to say hello (at most once per HELLO.cooldownMs).
 */
export function useYouCursor(label: RefObject<HTMLElement | null>) {
  const director = useDirector()

  useEffect(() => {
    const element = label.current
    if (!element) return
    let x = 0
    let y = 0
    let frame = 0
    let restTimer: ReturnType<typeof setTimeout> | undefined
    let lastHello = -Infinity

    const paint = () => {
      frame = 0
      element.style.transform = `translate(${x + YOU_CURSOR.offsetX}px, ${y + YOU_CURSOR.offsetY}px)`
    }
    const greet = () => {
      if (performance.now() - lastHello < HELLO.cooldownMs) return
      lastHello = performance.now()
      director.crew()?.greet({ x: x + window.scrollX, y: y + window.scrollY })
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
      x = event.clientX
      y = event.clientY
      element.dataset.visible = 'true'
      if (!frame) frame = requestAnimationFrame(paint)
      clearTimeout(restTimer)
      restTimer = setTimeout(greet, HELLO.idleMs)
    }
    const onLeave = () => {
      delete element.dataset.visible
      clearTimeout(restTimer)
    }

    const listeners = new AbortController()
    window.addEventListener('pointermove', onMove, { passive: true, signal: listeners.signal })
    document.documentElement.addEventListener('pointerleave', onLeave, { signal: listeners.signal })
    return () => {
      listeners.abort()
      cancelAnimationFrame(frame)
      clearTimeout(restTimer)
    }
  }, [director, label])
}
