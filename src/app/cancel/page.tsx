import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Checkout Return",
  description: "Checkout was closed. Check Account or contact Support if you believe you were charged.",
  alternates: { canonical: '/cancel' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Checkout Return · Linea',
    description: 'Checkout was closed. Check Account or contact Support if you believe you were charged.',
    url: '/cancel',
  },
  robots: { index: false, follow: false },
}

import { CheckoutStatePage } from '@/screens/AccountPages'

export default function Page() {
  return <CheckoutStatePage type="cancel" />
}
