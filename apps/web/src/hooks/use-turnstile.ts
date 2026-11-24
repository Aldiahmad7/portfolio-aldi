import { useCallback, useEffect, useRef, useState } from 'react'
import { loadTurnstile, type TurnstileApi } from '../lib/turnstile'

/** A submit waits this long for Cloudflare's token before giving up with an error. */
const TOKEN_WAIT_MS = 10_000

type Waiter = (token: string | null) => void

/**
 * Turnstile for one form: call `prepare` when the form is first focused (the script loads then),
 * `getToken` on submit, and `reset` after it (tokens are single use). Never throws.
 */
export function useTurnstile() {
  const container = useRef<HTMLDivElement>(null)
  const [prepared, setPrepared] = useState(false)
  const token = useRef<string | null>(null)
  const failed = useRef(false)
  const waiters = useRef(new Set<Waiter>())
  const widget = useRef<{ api: TurnstileApi; id: string } | null>(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

  const settle = useCallback((value: string | null) => {
    token.current = value
    waiters.current.forEach((waiter) => waiter(value))
    waiters.current.clear()
  }, [])

  useEffect(() => {
    const element = container.current
    if (!prepared || !element || !siteKey) return
    let cancelled = false
    loadTurnstile().then(
      (api) => {
        if (cancelled) return
        const id = api.render(element, {
          sitekey: siteKey,
          theme: 'dark',
          appearance: 'interaction-only',
          callback: settle,
          'expired-callback': () => (token.current = null),
          'error-callback': () => settle(null),
        })
        widget.current = { api, id }
      },
      () => {
        failed.current = true
        settle(null)
      },
    )
    return () => {
      cancelled = true
      if (widget.current) widget.current.api.remove(widget.current.id)
      widget.current = null
    }
  }, [prepared, siteKey, settle])

  const prepare = useCallback(() => setPrepared(true), [])

  const getToken = useCallback((): Promise<string | null> => {
    setPrepared(true)
    if (token.current) return Promise.resolve(token.current)
    if (failed.current || !siteKey) return Promise.resolve(null)
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        waiters.current.delete(waiter)
        resolve(null)
      }, TOKEN_WAIT_MS)
      const waiter: Waiter = (value) => {
        clearTimeout(timer)
        resolve(value)
      }
      waiters.current.add(waiter)
    })
  }, [siteKey])

  const reset = useCallback(() => {
    token.current = null
    if (widget.current) widget.current.api.reset(widget.current.id)
  }, [])

  return { container, prepare, getToken, reset }
}
