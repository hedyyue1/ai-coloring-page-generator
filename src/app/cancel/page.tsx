import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Checkout Cancelled",
  description: "Checkout was cancelled \u2014 no payment or entitlement change was created.",
}

import { CheckoutStatePage } from '@/screens/AccountPages'

export default function Page() {
  return <CheckoutStatePage type="cancel" />
}
