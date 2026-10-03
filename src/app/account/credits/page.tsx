import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "Credit history",
  description: "View your current credit balance and recent activity in Account.",
  alternates: { canonical: '/account' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Credit history · Linea',
    description: 'View your current credit balance and recent activity in Account.',
    url: '/account',
  },
}

export default function CreditsRedirect() {
  redirect('/account')
}
