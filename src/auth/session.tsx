'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type CreditEvent = {
  id: string
  type: 'grant' | 'reserve' | 'consume' | 'release' | 'expire' | 'refund'
  amount: number
  description: string
  createdAt: string
}

export type AccountSession = {
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
  subscription: {
    plan: string
    status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'none'
    priceLabel: string
    renewalDate?: string
  }
  credits: {
    available: number
    reserved: number
    usedThisCycle: number
    cycleLabel: string
    events: CreditEvent[]
  }
  deletionStatus: 'none' | 'requested' | 'processing'
}

type SessionState =
  | { status: 'loading'; account: null }
  | { status: 'unauthenticated'; account: null }
  | { status: 'authenticated'; account: AccountSession }

const SessionContext = createContext<SessionState>({ status: 'loading', account: null })

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading', account: null })

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/session', {
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return { authenticated: false as const }
        return response.json() as Promise<{ authenticated: boolean; account?: AccountSession }>
      })
      .then((payload) => {
        if (payload.authenticated && payload.account) {
          setState({ status: 'authenticated', account: payload.account })
        } else {
          setState({ status: 'unauthenticated', account: null })
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({ status: 'unauthenticated', account: null })
      })

    return () => controller.abort()
  }, [])

  const value = useMemo(() => state, [state])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  return useContext(SessionContext)
}
