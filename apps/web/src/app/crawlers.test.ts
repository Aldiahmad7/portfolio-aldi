import { describe, expect, it } from 'vitest'
import { renderRobots, renderSitemap } from './crawlers'

describe('crawler files', () => {
  it('robots.txt allows the site, blocks the API and links the sitemap', () => {
    expect(renderRobots('https://aldi.dev')).toBe(
      'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://aldi.dev/sitemap.xml\n',
    )
  })

  it('sitemap.xml lists the page with the build date', () => {
    const sitemap = renderSitemap('https://aldi.dev', '2026-11-24')
    expect(sitemap).toContain('<loc>https://aldi.dev/</loc><lastmod>2026-11-24</lastmod>')
  })
})
