import type { Metadata } from 'next'
import { PolicyPage } from '@/screens/PolicyPages'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with Google sign-in, subscriptions, photo previews, billing and privacy, by support form or email.',
  alternates: { canonical: '/support' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Support · Linea',
    description: 'Get help with Google sign-in, subscriptions, photo previews, billing and privacy, by support form or email.',
    url: '/support',
  },
  twitter: {
    card: 'summary',
    title: 'Support · Linea',
    description: 'Get help with Google sign-in, subscriptions, photo previews, billing and privacy, by support form or email.',
  },
}

export default function Page() {
  return <PolicyPage type="support" />
}
