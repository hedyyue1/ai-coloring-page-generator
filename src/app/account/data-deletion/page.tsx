import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Data Deletion",
  description: "Review deletion scope before requesting account data deletion.",
}

export { DataDeletionPage as default } from '@/screens/AccountPages'
