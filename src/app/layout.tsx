import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://coloringpageflow.com'),
  title: {
    default: 'Linea — Photo to Coloring Page',
    template: '%s · Linea',
  },
  description:
    'Create a browser-based photo coloring-page preview from a photo you have permission to use. Read download requirements and content rules.',
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Linea — Photo to Coloring Page',
    description: 'Create a browser-based photo coloring-page preview from a photo you have permission to use. Read download requirements and content rules.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
