import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Checkout Return",
  description: "Your Linea payment is being confirmed.",
}

import { CheckoutStatePage } from '@/screens/AccountPages'

export default function Page() {
  return <CheckoutStatePage type="success" />
}
