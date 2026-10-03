import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "Credit Ledger",
  description: "Shared coloring credit balance with append-only ledger events.",
  alternates: { canonical: '/account' },
}

export default function CreditsRedirect() {
  redirect('/account')
}
