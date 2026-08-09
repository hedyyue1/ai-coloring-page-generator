import type { MetadataRoute } from 'next'

const baseUrl = 'https://ai-coloring-page-generator.hedyyue1.workers.dev'

const publicRoutes = [
  '/',
  '/photo-to-coloring-page',
  '/text-to-coloring-page',
  '/support',
  '/terms',
  '/privacy',
  '/refunds',
  '/acceptable-use',
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: new Date(),
  }))
}