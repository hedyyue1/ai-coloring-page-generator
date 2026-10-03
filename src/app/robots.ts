import type { MetadataRoute } from 'next'

const baseUrl = 'https://coloringpageflow.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/account', '/checkout', '/login', '/success', '/cancel', '/generate', '/result', '/library', '/pricing'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}