import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Checkout Cancelled",
  description: "Checkout was cancelled — no payment or entitlement change was created.",
  alternates: { canonical: '/cancel' },
  robots: { index: false, follow: false },
}

import { CheckoutStatePage } from '@/screens/AccountPages'

export default function Page() {
  return <CheckoutStatePage type="cancel" />
}
