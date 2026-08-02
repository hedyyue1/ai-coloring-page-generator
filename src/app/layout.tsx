import type { Metadata } from 'next'
import { SessionProvider } from '@/auth/session'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Linea — AI Coloring Page Generator', template: '%s | Linea' },
  description: 'Turn your photos and ideas into clean, printable coloring pages.',
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/linea-mark.png' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SessionProvider>{children}</SessionProvider></body></html>
}
