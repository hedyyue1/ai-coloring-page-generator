import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your profile, subscription, credit ledger, and account data in one place.",
  alternates: { canonical: '/account' },
}

export { AccountPage as default } from '@/screens/AccountPages'
