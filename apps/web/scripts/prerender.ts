import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

interface PrerenderModule {
  renderPage: (buildDate: string) => { head: string; html: string; robots: string; sitemap: string }
}

// Only the display font is preloaded: it renders the hero name (the LCP element).
const PRELOADED_FONT = /^space-grotesk-latin-wght-normal-.*\.woff2$/

const distDirectory = new URL('../dist/', import.meta.url)
const ssrDirectory = new URL('../dist-ssr/', import.meta.url)
const indexPath = new URL('index.html', distDirectory)

function fontPreloadTag(): string {
  const font = readdirSync(new URL('assets/', distDirectory)).find((file) =>
    PRELOADED_FONT.test(file),
  )
  if (!font) return ''
  return `<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin />`
}

const { renderPage } = (await import(new URL('prerender.js', ssrDirectory).href)) as PrerenderModule

const buildDate = new Date().toISOString().slice(0, 'YYYY-MM-DD'.length)
const { head, html, robots, sitemap } = renderPage(buildDate)
const page = readFileSync(indexPath, 'utf8')
  .replace('<!--app-head-->', `${head}\n    ${fontPreloadTag()}`)
  .replace('<!--app-html-->', html)

writeFileSync(indexPath, page)
writeFileSync(new URL('robots.txt', distDirectory), robots)
writeFileSync(new URL('sitemap.xml', distDirectory), sitemap)
rmSync(fileURLToPath(ssrDirectory), { recursive: true, force: true })
process.stdout.write('Prerendered dist/index.html, robots.txt, sitemap.xml\n')
