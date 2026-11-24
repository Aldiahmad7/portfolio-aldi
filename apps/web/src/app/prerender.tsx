import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './App'
import { renderRobots, renderSitemap } from './crawlers'
import { renderHead } from './head'

// `vite preview` origin, used when VITE_SITE_URL is not set (local builds).
const FALLBACK_SITE_URL = 'http://localhost:4173'

export interface PrerenderedFiles {
  head: string
  html: string
  robots: string
  sitemap: string
}

/** SSR entry, only used at build time by scripts/prerender.ts. `buildDate` is YYYY-MM-DD. */
export function renderPage(buildDate: string): PrerenderedFiles {
  const siteUrl = import.meta.env.VITE_SITE_URL ?? FALLBACK_SITE_URL
  return {
    head: renderHead(siteUrl),
    robots: renderRobots(siteUrl),
    sitemap: renderSitemap(siteUrl, buildDate),
    html: renderToString(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  }
}
