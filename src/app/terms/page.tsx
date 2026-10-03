import type { Metadata } from 'next'
import { PolicyPage } from '@/screens/PolicyPages'

export const metadata: Metadata = {
  alternates: { canonical: '/terms' },
}

export default function Page() {
  return <PolicyPage type="terms" />
}
