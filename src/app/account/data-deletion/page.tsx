import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Data Deletion",
  description: "Review and manage your Linea account data.",
  alternates: { canonical: '/account/data-deletion' },
}

export { DataDeletionPage as default } from '@/screens/AccountPages'
