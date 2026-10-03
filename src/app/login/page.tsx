import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Sign in",
  description: "Use Google to access your Linea account, subscription and credit balance.",
  alternates: { canonical: '/login' },
  openGraph: {
    type: 'website',
    siteName: 'Linea',
    title: 'Sign in · Linea',
    description: 'Use Google to access your Linea account, subscription and credit balance.',
    url: '/login',
  },
  robots: { index: false, follow: false },
}

export { LoginPage as default } from '@/screens/ToolPages'
