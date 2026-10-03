import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Checkout Return",
  description: "Checkout return received — confirmation still pending.",
  alternates: { canonical: '/success' },
  robots: { index: false, follow: false },
}

import { CheckoutStatePage } from '@/screens/AccountPages'

export default function Page() {
  return <CheckoutStatePage type="success" />
}
