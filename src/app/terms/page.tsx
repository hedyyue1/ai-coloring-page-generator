import type { Metadata } from 'next'
import { PolicyPage } from '@/screens/PolicyPages'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Read the conditions for using Linea, including account access, photo previews, subscriptions and your content.',
  alternates: { canonical: '/terms' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Terms of Use · Linea',
    description: 'Read the conditions for using Linea, including account access, photo previews, subscriptions and your content.',
    url: '/terms',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Use · Linea',
    description: 'Read the conditions for using Linea, including account access, photo previews, subscriptions and your content.',
  },
}

export default function Page() {
  return <PolicyPage type="terms" />
}
