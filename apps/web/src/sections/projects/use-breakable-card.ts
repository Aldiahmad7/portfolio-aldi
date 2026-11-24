import { useEffect, useRef } from 'react'
import { centerOf } from '../../build/actions/geometry'
import { useDirector } from '../../build/build-provider'
import { EASE, REDUCED_MOTION_QUERY } from '../../build/config'
import { documentRect } from '../../build/overlay'
import { BREAK_CARD } from '../../interactions/config'

/**
 * Lets the visitor knock a project card out of place (docs/interactions.md §5): drag with a mouse,
 * or press and hold on touch. Only `transform` changes, never the DOM order. A plain click (moved
 * less than the threshold) still opens the project. Pixel puts the card back shortly after.
 */
export function useBreakableCard() {
  const director = useDirector()
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    // A non-null const, so the narrowing holds inside the handlers below.
    const card: HTMLButtonElement = element
    const listeners = new AbortController()
    const { signal } = listeners
    let offset = { x: 0, y: 0 }
    let restoreTimer: ReturnType<typeof setTimeout> | undefined
    let pressTimer: ReturnType<typeof setTimeout> | undefined
    let swallowClick = false

    const moveTo = (x: number, y: number) => {
      offset = { x, y }
      card.style.transform = x || y ? `translate(${x}px, ${y}px)` : ''
    }

    async function restore() {
      const from = card.style.transform
      if (!from) return
      await director.crew()?.react('pixel', centerOf(documentRect(card)), 'restore')
      moveTo(0, 0)
      if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return
      card.animate([{ transform: from }, { transform: 'none' }], {
        duration: BREAK_CARD.restoreMs,
        easing: EASE,
      })
    }

    const broken = () => {
      swallowClick = true
      clearTimeout(restoreTimer)
      restoreTimer = setTimeout(() => void restore(), BREAK_CARD.restoreDelayMs)
    }

    /** Listeners of one press, all removed when it ends. */
    function gesture() {
      const controller = new AbortController()
      const options = { signal: AbortSignal.any([signal, controller.signal]) }
      return { options, end: () => controller.abort() }
    }

    const travelled = (from: PointerEvent, to: PointerEvent) =>
      Math.hypot(to.clientX - from.clientX, to.clientY - from.clientY)

    function holdToShove(event: PointerEvent) {
      const { options, end } = gesture()
      const cancel = () => {
        clearTimeout(pressTimer)
        end()
      }
      pressTimer = setTimeout(() => {
        const angle = Math.random() * Math.PI * 2
        moveTo(Math.cos(angle) * BREAK_CARD.shovePx, Math.sin(angle) * BREAK_CARD.shovePx)
        broken()
      }, BREAK_CARD.longPressMs)
      card.addEventListener(
        'pointermove',
        (moveEvent) => travelled(event, moveEvent) > BREAK_CARD.dragThresholdPx && cancel(),
        options,
      )
      card.addEventListener('pointerup', cancel, options)
      card.addEventListener('pointercancel', cancel, options)
    }

    function drag(event: PointerEvent) {
      const { options, end } = gesture()
      const start = { x: event.clientX - offset.x, y: event.clientY - offset.y }
      let dragging = false
      const move = (moveEvent: PointerEvent) => {
        if (!dragging && travelled(event, moveEvent) < BREAK_CARD.dragThresholdPx) return
        if (!dragging) card.setPointerCapture(moveEvent.pointerId)
        dragging = true
        moveTo(moveEvent.clientX - start.x, moveEvent.clientY - start.y)
      }
      const drop = () => {
        end()
        if (dragging) broken()
      }
      card.addEventListener('pointermove', move, options)
      card.addEventListener('pointerup', drop, options)
      card.addEventListener('pointercancel', drop, options)
    }

    card.addEventListener(
      'pointerdown',
      (event) => {
        if (!event.isPrimary || event.button !== 0) return
        clearTimeout(restoreTimer)
        if (event.pointerType === 'touch') holdToShove(event)
        else drag(event)
      },
      { signal },
    )
    // Capture phase on the card runs before React's onClick, so a drag never opens the modal.
    card.addEventListener(
      'click',
      (event) => {
        if (!swallowClick) return
        swallowClick = false
        event.preventDefault()
        event.stopImmediatePropagation()
      },
      { capture: true, signal },
    )

    return () => {
      listeners.abort()
      clearTimeout(restoreTimer)
      clearTimeout(pressTimer)
    }
  }, [director])

  return ref
}
