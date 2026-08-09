import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Payment Pending",
  description: "Your Linea payment is being confirmed.",
  alternates: { canonical: '/checkout/pending' },
}

import { CheckoutStatePage } from '@/screens/AccountPages'

export default function Page() {
  return <CheckoutStatePage type="pending" />
}
