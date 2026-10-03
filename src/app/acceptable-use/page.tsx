import type { Metadata } from 'next'
import { PolicyPage } from '@/screens/PolicyPages'

export const metadata: Metadata = {
  alternates: { canonical: '/acceptable-use' },
}

export default function Page() {
  return <PolicyPage type="acceptable-use" />
}
