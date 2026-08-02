import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Subscription",
  description: "View and manage your Linea subscription.",
}

export { SubscriptionPage as default } from '@/screens/AccountPages'
