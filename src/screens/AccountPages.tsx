'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CircleAlert,
  CreditCard,
  FileText,
  Trash2,
  UserRound,
} from 'lucide-react'
import ProductLayout from '../components/ProductLayout'
import CheckoutPendingClient from '../components/CheckoutPendingClient'

type AccountUser = {
  id: string
  email: string | null
  displayName: string | null
  createdAt: string
  availableCredits: number
  subscription: { planId: string; status: string; periodEnd: string | null } | null
}

type CreditLedgerEntry = {
  id: string
  planId: string
  eventType: string
  delta: number
  referenceId: string
  createdAt: string
}

type AccountSnapshot = {
  user: AccountUser | null | undefined
  creditLedger: CreditLedgerEntry[]
  error: string
}

const planDetails: Record<string, { name: string; price: string; credits: number }> = {
  starter_monthly: { name: 'Starter', price: '$9.99 / month', credits: 200 },
  standard_monthly: { name: 'Standard', price: '$19.99 / month', credits: 500 },
  premium_monthly: { name: 'Premium', price: '$39.99 / month', credits: 1500 },
}

const subscriptionLabels: Record<string, string> = {
  active: 'Active', paid: 'Active', trialing: 'Subscription status needs review',
  pending: 'Payment confirmation pending', past_due: 'Payment needs attention',
  renewal_failed: 'Payment needs attention', cancel_scheduled: 'Cancellation scheduled',
  canceling: 'Cancellation scheduled', cancelled: 'Cancelled', canceled: 'Cancelled',
  refund_pending: 'Refund under review', refunded: 'Refunded',
  dispute_open: 'Payment concern under review', expired: 'Expired',
}

const creditActivityLabels: Record<string, string> = {
  grant: 'Credits added', reserve: 'Credits held', consume: 'Credits used',
  release: 'Credits returned', expire: 'Credits expired',
  reverse: 'Credit adjustment', refund_reversal: 'Credit adjustment', adjust: 'Credit adjustment',
}

function knownLabel(labels: Record<string, string>, value: string, fallback: string): string {
  return Object.prototype.hasOwnProperty.call(labels, value) ? labels[value] : fallback
}

function PageHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="subpage-header compact">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <span>{text}</span>
    </section>
  )
}

function useAccountSnapshot(): AccountSnapshot {
  const [snapshot, setSnapshot] = useState<AccountSnapshot>({ user: undefined, creditLedger: [], error: '' })

  useEffect(() => {
    let active = true
    let inFlight = false
    let controller: AbortController | null = null

    const refresh = async () => {
      if (!active || inFlight) return
      inFlight = true
      controller = new AbortController()
      try {
        const response = await fetch('/api/me', { cache: 'no-store', signal: controller.signal })
        if (!active) return
        if (!response.ok) throw new Error('Account request failed')
        const result = await response.json() as { user?: AccountUser | null; creditLedger?: CreditLedgerEntry[] }
        if (active) setSnapshot({ user: result.user ?? null, creditLedger: result.creditLedger ?? [], error: '' })
      } catch {
        // A failed refresh is not evidence that the authenticated session ended.
        if (active) setSnapshot((previous) => ({ ...previous, error: 'We could not load your account. Try again shortly. If the problem continues, contact Support.' }))
      } finally {
        inFlight = false
        controller = null
      }
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    void refresh()
    const interval = window.setInterval(refresh, 5000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      controller?.abort()
    }
  }, [])

  return snapshot
}

function AccountContent({ snapshot, returnTo, children }: { snapshot: AccountSnapshot; returnTo: string; children: (user: AccountUser) => ReactNode }) {
  if (snapshot.error) return <p className="prototype-alert"><CircleAlert size={16} /> {snapshot.error}</p>
  if (snapshot.user === undefined) return <p className="prototype-alert">Loading your account…</p>
  if (snapshot.user === null) {
    return (
      <section className="checkout-state-page"><article className="checkout-state-card">
        <h2>Sign in to view your account</h2>
        <p>Sign in with the Google account you use for Linea to view its details.</p>
        <a className="primary-button" href={`/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`}>Continue with Google</a>
      </article></section>
    )
  }
  return <>{children(snapshot.user)}</>
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

function accountName(user: AccountUser): string {
  return user.displayName || user.email || 'Signed-in user'
}

export function AccountPage() {
  const snapshot = useAccountSnapshot()

  return (
    <ProductLayout>
      <PageHeader eyebrow="Account" title="Your account." text="View your profile, subscription and credits. Contact Support for cancellation or account-data requests." />
      <AccountContent snapshot={snapshot} returnTo="/account">{(user) => {
        return <>
          <section className="account-summary-grid">
            <article className="account-identity-card">
              <div className="avatar-mark"><UserRound size={25} /></div>
              <div><h2>{accountName(user)}</h2>{user.email && <p>{user.email}</p>}</div>
            </article>
          </section>
          <section className="account-detail-section" aria-labelledby="subscription-heading">
            <h2 id="subscription-heading">Subscription</h2>
            <SubscriptionContent user={user} />
          </section>
          <section className="account-detail-section" aria-labelledby="credits-heading">
            <h2 id="credits-heading">Credit activity</h2>
            <CreditsContent user={user} creditLedger={snapshot.creditLedger} />
          </section>
          <section className="account-detail-section" aria-labelledby="deletion-heading">
            <h2 id="deletion-heading">Data deletion</h2>
            <DataDeletionContent />
          </section>
        </>
      }}</AccountContent>
    </ProductLayout>
  )
}

function SubscriptionContent({ user }: { user: AccountUser }) {
  const subscription = user.subscription
  const plan = subscription && Object.prototype.hasOwnProperty.call(planDetails, subscription.planId) ? planDetails[subscription.planId] : null
  return (
    <article className="current-plan-card">
      <h3>{plan ? `${plan.name} · ${plan.price}` : subscription?.planId === 'free' ? 'Free' : subscription ? 'Unknown plan — contact Support' : 'No paid subscription'}</h3>
      <p>Status: {subscription ? knownLabel(subscriptionLabels, subscription.status, 'Status unavailable — contact Support') : 'Not subscribed'}</p>
      {subscription?.periodEnd ? <p>Current period ends {formatDate(subscription.periodEnd)}</p> : null}
      <p>Renewal information is not available here. <Link href="/support">Contact Support for billing details.</Link></p>
      <Link className="primary-button" href="/pricing">Compare plans</Link>
    </article>
  )
}

function CreditsContent({ user, creditLedger }: { user: AccountUser; creditLedger: CreditLedgerEntry[] }) {
  const latestEntries = creditLedger.slice(0, 5)
  return (
    <article className="ledger-table-card">
      <p className="table-heading">Available credits: <strong>{user.availableCredits}</strong></p>
      <p>Recent credit activity (latest 5)</p>
      <div className="responsive-table">
        <table>
          <thead><tr><th>Date</th><th>Activity</th><th>Amount</th></tr></thead>
          <tbody>
            {latestEntries.length ? latestEntries.map((entry) => (
              <tr key={entry.id}><td>{formatDate(entry.createdAt)}</td><td>{knownLabel(creditActivityLabels, entry.eventType, 'Activity information unavailable')}</td><td>{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</td></tr>
            )) : <tr><td colSpan={3}>No credit activity to show.</td></tr>}
          </tbody>
        </table>
      </div>
    </article>
  )
}

function DataDeletionContent() {
  return (
    <article className="deletion-request-card">
      <Trash2 size={25} />
      <p>Self-service deletion is unavailable. Contact Support to request account-data deletion. We may need to verify the account is yours. A request does not immediately delete data or cancel a subscription; some payment records may be retained where required by law.</p>
      <Link href="/support">Contact support <ArrowRight size={16} /></Link>
    </article>
  )
}

export function CheckoutStatePage({ type }: { type: 'pending' | 'success' | 'cancel' }) {
  if (type === 'pending') return <ProductLayout><CheckoutPendingClient /></ProductLayout>

  const config = {
    success: {
      title: 'Check your payment in Account',
      text: 'Returning from checkout does not confirm payment. Check Account for your subscription and credits before trying another payment.',
      action: 'View account',
      href: '/account',
    },
    cancel: {
      title: 'You returned from checkout.',
      text: 'You left checkout without completing it here. This page does not confirm whether a charge occurred. Check Account and contact Support if you believe you were charged.',
      action: 'View account',
      href: '/account',
    },
  }[type]

  return (
    <ProductLayout>
      <section className="checkout-state-page">
        <article className="checkout-state-card">
          <span className="checkout-icon"><CreditCard size={28} /></span>
          <h1>{config.title}</h1>
          <p>{config.text}</p>
          <div className="button-row center">
            <Link className="primary-button" href={config.href}>{config.action}</Link>
            <Link className="secondary-button" href="/support"><FileText size={16} /> Support</Link>
          </div>
        </article>
      </section>
    </ProductLayout>
  )
}
