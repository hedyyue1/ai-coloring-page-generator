'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
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
        if (active) setSnapshot((previous) => ({ ...previous, error: 'Account state could not be loaded. Please try again shortly.' }))
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
        <p>This page only displays data for the currently authenticated Google account.</p>
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
      <PageHeader eyebrow="Account" title="Your account." text="Manage your profile, subscription, credits, and account data in one place." />
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
            <h2 id="credits-heading">Credit ledger</h2>
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
  const plan = subscription ? planDetails[subscription.planId] : null
  return (
    <article className="current-plan-card">
      <h3>{plan ? `${plan.name} · ${plan.price}` : subscription ? subscription.planId : 'No paid subscription'}</h3>
      <p>Status: {subscription?.status || 'Not subscribed'}</p>
      <p>{subscription?.periodEnd ? `Current period ends ${formatDate(subscription.periodEnd)}` : 'No renewal date'}</p>
      <Link className="primary-button" href="/pricing">Compare plans</Link>
    </article>
  )
}

function CreditsContent({ user, creditLedger }: { user: AccountUser; creditLedger: CreditLedgerEntry[] }) {
  const latestEntries = creditLedger.slice(0, 5)
  return (
    <article className="ledger-table-card">
      <p className="table-heading">Available credits: <strong>{user.availableCredits}</strong></p>
      <div className="responsive-table">
        <table>
          <thead><tr><th>Date</th><th>Event</th><th>Amount</th></tr></thead>
          <tbody>
            {latestEntries.length ? latestEntries.map((entry) => (
              <tr key={entry.id}><td>{formatDate(entry.createdAt)}</td><td>{entry.eventType}</td><td>{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</td></tr>
            )) : <tr><td colSpan={3}>No credit events have been recorded for this account.</td></tr>}
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
      <p>Self-service deletion is not available. Deletion requires confirmation, and some payment records may be retained where legally required.</p>
      <Link href="/support">Contact support <ArrowRight size={16} /></Link>
    </article>
  )
}

export function CheckoutStatePage({ type }: { type: 'pending' | 'success' | 'cancel' }) {
  if (type === 'pending') return <ProductLayout><CheckoutPendingClient /></ProductLayout>

  const config = {
    success: {
      label: 'return_success',
      title: 'Return received — confirmation still pending.',
      text: 'This page waits for the verified webhook before showing an active subscription or granted credits.',
      action: 'View subscription',
      href: '/account',
    },
    cancel: {
      label: 'return_cancel',
      title: 'Checkout was cancelled.',
      text: 'No payment, subscription, credit grant, or entitlement change was created.',
      action: 'Return to pricing',
      href: '/pricing',
    },
  }[type]

  const steps = [
    ['checkout_intent_created', true],
    ['creem_hosted_checkout', true],
    [type === 'cancel' ? 'return_cancel' : 'return_success', true],
    ['webhook_signature_verified', false],
    ['subscription_entitlement_changed', false],
  ]

  return (
    <ProductLayout>
      <section className="checkout-state-page">
        <article className="checkout-state-card">
          <span className="checkout-icon"><CreditCard size={28} /></span>
          <p className="detail-status">{config.label}</p>
          <h1>{config.title}</h1>
          <p>{config.text}</p>
          <div className="checkout-timeline">
            {steps.map(([step, done]) => (
              <div className={done ? 'done' : ''} key={step as string}>{done ? <Check size={16} /> : <CircleAlert size={16} />}<code>{step}</code></div>
            ))}
          </div>
          <div className="button-row center">
            <Link className="primary-button" href={config.href}>{config.action}</Link>
            <Link className="secondary-button" href="/support"><FileText size={16} /> Support</Link>
          </div>
        </article>
      </section>
    </ProductLayout>
  )
}
