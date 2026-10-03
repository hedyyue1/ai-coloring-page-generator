'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, CircleAlert, RefreshCcw } from 'lucide-react'

export default function CheckoutPendingClient() {
  const [status, setStatus] = useState<'checking' | 'confirmed' | 'signed_out' | 'error'>('checking')
  const [subscriptionStatus, setSubscriptionStatus] = useState('')

  useEffect(() => {
    let active = true
    async function check() {
      try {
        const response = await fetch('/api/me', { cache: 'no-store' })
        if (!response.ok) throw new Error('Account request failed')
        const result = await response.json() as { user?: { subscription?: { planId: string; status: string } | null } | null }
        if (!active) return
        if (!result.user) return setStatus('signed_out')
        if (result.user.subscription && ['active', 'trialing', 'paid'].includes(result.user.subscription.status)) {
          setSubscriptionStatus(result.user.subscription.status)
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
        <p className="detail-status">{status === 'confirmed' && subscriptionStatus !== 'trialing' ? 'Subscription active' : 'Check payment status'}</p>
        <h1>{status === 'confirmed'
          ? subscriptionStatus === 'trialing' ? 'Subscription status needs review.' : 'Your account shows an active subscription.'
          : status === 'signed_out' ? 'Sign in to check your subscription.'
          : status === 'error' ? 'We could not check your subscription status.'
          : 'Checking your subscription status…'}</h1>
        <p>
          {status === 'confirmed'
            ? subscriptionStatus === 'trialing'
              ? 'Your subscription status needs review. View Account or contact Support. This does not confirm the checkout you just attempted.'
              : 'Your account shows an active subscription. View Account for your current credits. This does not by itself confirm the checkout you just attempted.'
            : 'Returning from checkout does not confirm a payment. Check Account for confirmed subscription access.'}
        </p>
        <p>Do not repeat a payment to resolve missing access.</p>
        {status === 'signed_out' ? <p className="prototype-alert"><CircleAlert size={16} /> Sign in with Google to check your subscription status.</p> : null}
        {status === 'error' ? <p className="prototype-alert"><CircleAlert size={16} /> We could not check your account status. Try again or contact Support; do not repeat a payment to resolve this.</p> : null}
        <div className="button-row center">
          <Link className="primary-button" href="/account">View account</Link>
          <Link className="secondary-button" href="/pricing">Back to pricing</Link>
          <Link className="secondary-button" href="/support">Contact Support</Link>
        </div>
      </article>
    </section>
  )
}
