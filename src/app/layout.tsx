import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Linea — Photo & Text to Coloring Page',
    template: '%s · Linea',
  },
  description:
    'Linea helps adults prepare one standard coloring activity page from an authorized photo or an original text theme.',
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
