import { useEffect, useMemo, useRef } from 'react'
import { useDirector } from '../../build/build-provider'
import { REDUCED_MOTION_QUERY } from '../../build/config'
import type { CommandApi } from './commands'

const ACCENT_TOKEN = '--color-accent'

/** Builds the narrow API commands get. `close(false)` leaves focus where the command put it. */
export function useCommandApi(
  close: (returnFocus: boolean) => void,
  print: (lines: readonly string[]) => void,
): CommandApi {
  const director = useDirector()
  const accentTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const root = typeof document === 'undefined' ? null : document.documentElement

  // The accent swap is temporary: never leave it behind when the bar goes away.
  useEffect(
    () => () => {
      clearTimeout(accentTimer.current)
      root?.style.removeProperty(ACCENT_TOKEN)
    },
    [root],
  )

  return useMemo(
    () => ({
      director,
      print,
      close: () => close(true),
      scrollTo(sectionId) {
        close(false)
        const section = document.getElementById(sectionId)
        const smooth = !window.matchMedia(REDUCED_MOTION_QUERY).matches
        section?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
        // The first field, so "hire me" lands in the contact form ready to type.
        section?.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true })
      },
      setAccent(value, ms) {
        root?.style.setProperty(ACCENT_TOKEN, value)
        clearTimeout(accentTimer.current)
        return new Promise((resolve) => {
          accentTimer.current = setTimeout(() => {
            root?.style.removeProperty(ACCENT_TOKEN)
            resolve()
          }, ms)
        })
      },
    }),
    [director, close, print, root],
  )
}
