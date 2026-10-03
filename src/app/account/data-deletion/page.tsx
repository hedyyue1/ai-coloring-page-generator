import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "Data Deletion",
  description: "Contact Support to request account-data deletion. Sending a request does not immediately delete your account or cancel a subscription.",
  alternates: { canonical: '/account' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Data Deletion · Linea',
    description: 'Contact Support to request account-data deletion. Sending a request does not immediately delete your account or cancel a subscription.',
    url: '/account',
  },
}

export default function DataDeletionRedirect() {
  redirect('/account')
}
