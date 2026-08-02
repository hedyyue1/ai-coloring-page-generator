import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Credit Ledger",
  description: "Shared coloring credit balance with append-only ledger events.",
}

export { CreditsPage as default } from '@/screens/AccountPages'
