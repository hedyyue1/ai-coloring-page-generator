import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Photo to Coloring Page Preview',
  description: 'Create a browser-based photo coloring-page preview from a photo you have permission to use. Read download requirements and content rules.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Photo to Coloring Page Preview · Linea',
    description: 'Create a browser-based photo coloring-page preview from a photo you have permission to use. Read download requirements and content rules.',
    url: '/',
  },
}

export { default } from '@/screens/Home'
