'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, CircleAlert, RefreshCcw } from 'lucide-react'

export default function CheckoutPendingClient() {
  const [status, setStatus] = useState<'checking' | 'confirmed' | 'signed_out' | 'error'>('checking')
  const [plan, setPlan] = useState('')

  useEffect(() => {
    let active = true
    async function check() {
      try {
        const response = await fetch('/api/me', { cache: 'no-store' })
        const result = await response.json() as { user?: { subscription?: { planId: string; status: string } | null } | null }
        if (!active) return
        if (!result.user) return setStatus('signed_out')
        if (result.user.subscription && ['active', 'trialing', 'paid'].includes(result.user.subscription.status)) {
          setPlan(result.user.subscription.planId)
          setStatus('confirmed')
        } else setStatus('checking')
      } catch {
        if (active) setStatus('error')
      }
    }
    void check()
    const timer = window.setInterval(check, 2500)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  return (
    <section className="checkout-state-page">
      <article className="checkout-state-card">
        <span className="checkout-icon">{status === 'confirmed' ? <Check size={28} /> : <RefreshCcw size={28} />}</span>
        <p className="detail-status">{status === 'confirmed' ? 'subscription_entitlement_active' : 'payment_sync_pending'}</p>
        <h1>{status === 'confirmed' ? 'Your subscription is active.' : 'Payment is being confirmed.'}</h1>
        <p>
          {status === 'confirmed'
            ? `${plan} is active and its credit grant is now visible in your account.`
            : 'Returning from hosted checkout does not activate a plan. This page waits for a verified Creem webhook and authoritative server state.'}
        </p>
        {status === 'signed_out' ? <p className="prototype-alert"><CircleAlert size={16} /> Sign in again to check your payment state.</p> : null}
        {status === 'error' ? <p className="prototype-alert"><CircleAlert size={16} /> Status is temporarily unavailable; no entitlement has been claimed.</p> : null}
        <div className="button-row center">
          <Link className="primary-button" href="/account">View account</Link>
          <Link className="secondary-button" href="/pricing">Back to pricing</Link>
        </div>
      </article>
    </section>
  )
}
