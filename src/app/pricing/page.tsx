import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Monthly Plans",
  description: "Compare monthly plans and credit allowances. New purchases are currently unavailable.",
  alternates: { canonical: '/pricing' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Monthly Plans · Linea',
    description: 'Compare monthly plans and credit allowances. New purchases are currently unavailable.',
    url: '/pricing',
  },
  robots: { index: false, follow: true },
}

export { PricingPage as default } from '@/screens/ToolPages'
