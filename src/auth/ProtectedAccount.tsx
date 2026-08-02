'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import type { AccountSession } from './session'
import { useSession } from './session'

export default function ProtectedAccount({ children }: { children: (account: AccountSession) => React.ReactNode }) {
  const session = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (session.status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/account')}`)
    }
  }, [pathname, router, session.status])

  if (session.status !== 'authenticated') {
    return (
      <div className="account-loading" role="status" aria-live="polite">
        <LoaderCircle size={22} className="spin" />
        <span>{session.status === 'loading' ? 'Checking your account…' : 'Redirecting to sign in…'}</span>
      </div>
    )
  }

  return children(session.account)
}
