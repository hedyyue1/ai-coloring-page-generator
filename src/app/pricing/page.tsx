import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the Linea coloring credit plan that fits you.",
  alternates: { canonical: '/pricing' },
  robots: { index: false, follow: true },
}

export { PricingPage as default } from '@/screens/ToolPages'
