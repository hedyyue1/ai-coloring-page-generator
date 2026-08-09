import type { Metadata } from 'next'
import { PolicyPage } from '@/screens/PolicyPages'

export const metadata: Metadata = {
  alternates: { canonical: '/privacy' },
}

export default function Page() {
  return <PolicyPage type="privacy" />
}
