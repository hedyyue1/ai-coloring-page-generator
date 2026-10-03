import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "Subscription",
  description: "Subscription and renewal control center.",
  alternates: { canonical: '/account' },
}

export default function SubscriptionRedirect() {
  redirect('/account')
}
