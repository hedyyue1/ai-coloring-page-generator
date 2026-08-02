import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Payment Pending",
  description: "Payment confirmation state \u2014 entitlement waits for verified webhook events.",
}

import { CheckoutStatePage } from '@/screens/AccountPages'

export default function Page() {
  return <CheckoutStatePage type="pending" />
}
