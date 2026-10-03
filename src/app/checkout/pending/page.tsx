import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Payment Pending",
  description: "Payment confirmation state — entitlement waits for verified webhook events.",
  alternates: { canonical: '/checkout/pending' },
}

import { CheckoutStatePage } from '@/screens/AccountPages'

export default function Page() {
  return <CheckoutStatePage type="pending" />
}
