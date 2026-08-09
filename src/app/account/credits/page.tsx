import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Credit activity",
  description: "View your Linea credit balance and recent activity.",
  alternates: { canonical: '/account/credits' },
}

export { CreditsPage as default } from '@/screens/AccountPages'
