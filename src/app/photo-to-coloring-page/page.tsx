import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Photo to Coloring Page",
  description: "Turn a photo you own or have permission to use into a black-and-white coloring-page preview. PNG downloads require Google sign-in and an eligible subscription.",
  alternates: { canonical: '/photo-to-coloring-page' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Photo to Coloring Page · Linea',
    description: 'Turn a photo you own or have permission to use into a black-and-white coloring-page preview. PNG downloads require Google sign-in and an eligible subscription.',
    url: '/photo-to-coloring-page',
  },
}

import { ToolPage } from '@/screens/ToolPages'

export default function Page() {
  return <ToolPage mode="photo" />
}
