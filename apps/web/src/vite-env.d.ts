/// <reference types="vite/client" />

declare module 'virtual:dummy-count' {
  const count: number
  export default count
}

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string
  readonly VITE_TURNSTILE_SITE_KEY?: string
}
