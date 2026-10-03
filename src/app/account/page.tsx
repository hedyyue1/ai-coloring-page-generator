import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Your Account",
  description: "View your account, subscription and recent credit activity; contact Support for account-data requests.",
  alternates: { canonical: '/account' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Your Account · Linea',
    description: 'View your account, subscription and recent credit activity; contact Support for account-data requests.',
    url: '/account',
  },
}

export { AccountPage as default } from '@/screens/AccountPages'
