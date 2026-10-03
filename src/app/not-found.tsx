import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'We could not find this page. Return home or visit Support if you need help.',
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Page Not Found · Linea',
    description: 'We could not find this page. Return home or visit Support if you need help.',
  },
  twitter: {
    card: 'summary',
    title: 'Page Not Found · Linea',
    description: 'We could not find this page. Return home or visit Support if you need help.',
  },
}

export { NotFoundPage as default } from '@/screens/PolicyPages'
