import { createApp } from './app'

/** Worker entry: /api/* reaches Hono, every other path is served from the web build (ADR-0004). */
export default createApp()
