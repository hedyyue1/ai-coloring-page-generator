import type { Metadata } from 'next'
import { PolicyPage } from '@/screens/PolicyPages'

export const metadata: Metadata = {
  title: 'Refunds and Cancellation',
  description: 'Contact Linea support about a billing concern, refund request or subscription cancellation. Requests are reviewed individually.',
  alternates: { canonical: '/refunds' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Refunds and Cancellation · Linea',
    description: 'Contact Linea support about a billing concern, refund request or subscription cancellation. Requests are reviewed individually.',
    url: '/refunds',
  },
  twitter: {
    card: 'summary',
    title: 'Refunds and Cancellation · Linea',
    description: 'Contact Linea support about a billing concern, refund request or subscription cancellation. Requests are reviewed individually.',
  },
}

export default function Page() {
  return <PolicyPage type="refunds" />
}
