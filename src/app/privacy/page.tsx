import type { Metadata } from 'next'
import { PolicyPage } from '@/screens/PolicyPages'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Linea handles your original photo, generated preview, Google account information and support requests.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Privacy Policy · Linea',
    description: 'Learn how Linea handles your original photo, generated preview, Google account information and support requests.',
    url: '/privacy',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy · Linea',
    description: 'Learn how Linea handles your original photo, generated preview, Google account information and support requests.',
  },
}

export default function Page() {
  return <PolicyPage type="privacy" />
}
