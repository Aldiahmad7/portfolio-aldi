/** The parts of Cloudflare's Turnstile API this site uses (explicit rendering). */
export interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

interface TurnstileOptions {
  sitekey: string
  theme: 'dark'
  /** The widget stays invisible unless Cloudflare needs the visitor to click it. */
  appearance: 'interaction-only'
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let loading: Promise<TurnstileApi> | null = null

/** Adds the Turnstile script once, on first need (a form is focused), never at page load. */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing'))
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('Turnstile failed to load'))
    }
    document.head.append(script)
  })
  return loading
}
