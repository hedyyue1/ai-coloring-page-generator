import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Account",
  description: "View your Linea account, credits, and subscription.",
  alternates: { canonical: '/account' },
}

export { AccountPage as default } from '@/screens/AccountPages'
