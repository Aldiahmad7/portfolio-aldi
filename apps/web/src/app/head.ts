import { seo } from '../content/seo'
import { escapeHtml } from '../lib/escape-html'

/** Builds <head> tags from content/seo.ts. `siteUrl` comes from VITE_SITE_URL. */
export function renderHead(siteUrl: string): string {
  const absolute = (path: string) => new URL(path, siteUrl).toString()
  const tags: [string, Record<string, string>][] = [
    ['meta', { name: 'description', content: seo.description }],
    ['link', { rel: 'canonical', href: absolute('/') }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: seo.title }],
    ['meta', { property: 'og:description', content: seo.description }],
    ['meta', { property: 'og:url', content: absolute('/') }],
    ['meta', { property: 'og:image', content: absolute(seo.ogImage) }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ]

  const rendered = tags.map(([tag, attributes]) => {
    const attributeText = Object.entries(attributes)
      .map(([name, value]) => `${name}="${escapeHtml(value)}"`)
      .join(' ')
    return `<${tag} ${attributeText} />`
  })

  return [`<title>${escapeHtml(seo.title)}</title>`, ...rendered].join('\n    ')
}
