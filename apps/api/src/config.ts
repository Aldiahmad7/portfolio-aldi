/** API constants (docs/backend-api.md). Limits that the web app shares live in @cursor-crew/shared. */
export const BODY_LIMIT_BYTES = 8 * 1024
export const COMMENTS_CACHE_SECONDS = 30
export const BUILDS_COUNTER_KEY = 'builds'
export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
export const RESEND_EMAILS_URL = 'https://api.resend.com/emails'
/** Rate limit key when the request has no CF-Connecting-IP header (local development only). */
export const LOCAL_CLIENT_KEY = 'local'
