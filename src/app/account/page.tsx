import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Account",
  description: "Account overview, identity state, credits, and subscription summary.",
}

export { AccountPage as default } from '@/screens/AccountPages'
