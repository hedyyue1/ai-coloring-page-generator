import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Payment Confirmation Pending",
  description: "Returning from checkout does not confirm payment. Check your account for subscription status.",
  alternates: { canonical: '/success' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Payment Confirmation Pending · Linea',
    description: 'Returning from checkout does not confirm payment. Check your account for subscription status.',
    url: '/success',
  },
  robots: { index: false, follow: false },
}

import { CheckoutStatePage } from '@/screens/AccountPages'

export default function Page() {
  return <CheckoutStatePage type="success" />
}
