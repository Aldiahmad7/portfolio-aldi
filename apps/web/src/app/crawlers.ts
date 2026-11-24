/** robots.txt: everything may be crawled except the API; points crawlers at the sitemap. */
export function renderRobots(siteUrl: string): string {
  const sitemap = new URL('/sitemap.xml', siteUrl).toString()
  return ['User-agent: *', 'Allow: /', 'Disallow: /api/', `Sitemap: ${sitemap}`, ''].join('\n')
}

/** sitemap.xml for the single page; project details are modals (?project=), not separate pages. */
export function renderSitemap(siteUrl: string, buildDate: string): string {
  const page = new URL('/', siteUrl).toString()
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${page}</loc><lastmod>${buildDate}</lastmod></url>`,
    '</urlset>',
    '',
  ].join('\n')
}
