import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Text to Coloring Page",
  description: "Text-to-coloring generation is currently unavailable. Use the photo tool to create a preview.",
  alternates: { canonical: '/text-to-coloring-page' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Text to Coloring Page · Linea',
    description: 'Text-to-coloring generation is currently unavailable. Use the photo tool to create a preview.',
    url: '/text-to-coloring-page',
  },
}

import { ToolPage } from '@/screens/ToolPages'

export default function Page() {
  return <ToolPage mode="text" />
}
