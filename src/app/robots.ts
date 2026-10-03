import type { MetadataRoute } from 'next'

const baseUrl = 'https://ai-coloring-page-generator.hedyyue1.workers.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account/', '/checkout/', '/login', '/success', '/cancel'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}