import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Subscription Status",
  description: "Check your account for subscription access after checkout. Do not repeat payment to fix missing access.",
  alternates: { canonical: '/checkout/pending' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Subscription Status · Linea',
    description: 'Check your account for subscription access after checkout. Do not repeat payment to fix missing access.',
    url: '/checkout/pending',
  },
}

import { CheckoutStatePage } from '@/screens/AccountPages'

export default function Page() {
  return <CheckoutStatePage type="pending" />
}
