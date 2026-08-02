import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Credit activity",
  description: "View your Linea credit balance and recent activity.",
}

export { CreditsPage as default } from '@/screens/AccountPages'
