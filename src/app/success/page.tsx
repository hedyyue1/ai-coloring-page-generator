import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Checkout Return",
  description: "Checkout return received \u2014 confirmation still pending.",
}

import { CheckoutStatePage } from '@/screens/AccountPages'

export default function Page() {
  return <CheckoutStatePage type="success" />
}
