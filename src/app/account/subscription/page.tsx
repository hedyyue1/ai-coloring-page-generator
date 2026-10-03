import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "Subscription",
  description: "View your subscription information in Account and contact Support for cancellation.",
  alternates: { canonical: '/account' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Subscription · Linea',
    description: 'View your subscription information in Account and contact Support for cancellation.',
    url: '/account',
  },
}

export default function SubscriptionRedirect() {
  redirect('/account')
}
