import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Sign in",
  description: "Google sign-in for the Linea account area.",
  alternates: { canonical: '/login' },
  robots: { index: false, follow: false },
}

export { LoginPage as default } from '@/screens/ToolPages'
