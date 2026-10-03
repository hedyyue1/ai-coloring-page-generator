import type { Metadata } from 'next'
import { PolicyPage } from '@/screens/PolicyPages'

export const metadata: Metadata = {
  title: 'Acceptable Use',
  description: 'Learn what you may submit to Linea and what content is not allowed. For adults preparing coloring activities.',
  alternates: { canonical: '/acceptable-use' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Acceptable Use · Linea',
    description: 'Learn what you may submit to Linea and what content is not allowed. For adults preparing coloring activities.',
    url: '/acceptable-use',
  },
  twitter: {
    card: 'summary',
    title: 'Acceptable Use · Linea',
    description: 'Learn what you may submit to Linea and what content is not allowed. For adults preparing coloring activities.',
  },
}

export default function Page() {
  return <PolicyPage type="acceptable-use" />
}
