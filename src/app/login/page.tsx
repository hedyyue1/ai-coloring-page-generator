import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Linea account.",
  alternates: { canonical: '/login' },
  robots: { index: false, follow: false },
}

export { LoginPage as default } from '@/screens/ToolPages'
