import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "Data Deletion",
  description: "Review deletion scope before requesting account data deletion.",
  alternates: { canonical: '/account' },
}

export default function DataDeletionRedirect() {
  redirect('/account')
}
