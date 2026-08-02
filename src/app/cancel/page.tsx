import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Checkout Cancelled",
  description: "Your Linea checkout was cancelled.",
}

import { CheckoutStatePage } from '@/screens/AccountPages'

export default function Page() {
  return <CheckoutStatePage type="cancel" />
}
