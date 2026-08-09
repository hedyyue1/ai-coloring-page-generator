import type { Metadata } from 'next'
import { SessionProvider } from '@/auth/session'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-coloring-page-generator.hedyyue1.workers.dev'),
  title: { default: 'Linea — AI Coloring Page Generator', template: '%s | Linea' },
  description: 'Turn your photos and ideas into clean, printable coloring pages.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo-mark.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SessionProvider>{children}</SessionProvider></body></html>
}
