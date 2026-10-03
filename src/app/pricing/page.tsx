import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Pricing",
  description: "Monthly coloring credit plans — proposal pending owner approval.",
  alternates: { canonical: '/pricing' },
  robots: { index: false, follow: true },
}

export { PricingPage as default } from '@/screens/ToolPages'
