'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleAlert,
  CreditCard,
  FileText,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import ProductLayout from '../components/ProductLayout'
import ProtectedAccount from '../auth/ProtectedAccount'

function PageHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="subpage-header compact">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <span>{text}</span>
    </section>
  )
}

export function AccountPage() {
  const cards: Array<[string, string, string, LucideIcon]> = [
    ['Subscription', 'View your current plan and renewal status', '/account/subscription', BadgeCheck],
    ['Credit history', 'Review credit activity and your current balance', '/account/credits', WalletCards],
    ['Payment states', 'Review recent checkout status', '/checkout/pending', CreditCard],
    ['Data deletion', 'Manage your data and privacy settings', '/account/data-deletion', Trash2],
  ]

  return (
    <ProtectedAccount>{(account) => <ProductLayout>
      <PageHeader
        eyebrow="Your account"
        title={`Welcome back, ${account.user.name}.`}
        text="Manage your profile, subscription, credits, and privacy settings."
      />

      <section className="account-summary-grid">
        <article className="account-identity-card">
          <div className="avatar-mark"><UserRound size={25} /></div>
          <div>
            <span>Signed-in account</span>
            <h2>{account.user.name}</h2>
            <p>{account.user.email}</p>
          </div>
        </article>
        <article className="account-metric-card">
          <span>Available credits</span>
          <strong>{account.credits.available}</strong>
          <p>{account.credits.cycleLabel}</p>
        </article>
        <article className="account-metric-card">
          <span>Subscription</span>
          <strong>{account.subscription.plan}</strong>
          <p>{account.subscription.priceLabel}</p>
        </article>
        <article className="account-metric-card warning">
          <span>Deletion</span>
          <strong>{account.deletionStatus === 'none' ? 'Not requested' : account.deletionStatus === 'requested' ? 'Requested' : 'Processing'}</strong>
          <p>Manage your data and privacy settings</p>
        </article>
      </section>

      <section className="account-card-grid">
        {cards.map(([title, text, href, CardIcon]) => (
          <Link className="account-link-card" href={href} key={title}>
            <CardIcon size={23} />
            <h2>{title}</h2>
            <p>{text}</p>
            <span>Open page <ArrowRight size={15} /></span>
          </Link>
        ))}
      </section>
    </ProductLayout>}</ProtectedAccount>
  )
}

export function SubscriptionPage() {
  const lifecycle = [
    ['Plan selected', 'Your selected plan is shown here.'],
    ['Payment confirmed', 'Your subscription updates after payment is confirmed.'],
    ['Credits added', 'Included credits are added to your account.'],
    ['Renewal', 'Your plan renews on the date shown below.'],
  ]

  return (
    <ProtectedAccount>{(account) => <ProductLayout>
      <PageHeader
        eyebrow="Subscription"
        title="Your plan and renewal details."
        text="Review your current plan, included credits, and renewal status."
      />

      <section className="subscription-panel">
        <article className="current-plan-card">
          <span>Current plan</span>
          <h2>{account.subscription.plan} · {account.subscription.priceLabel}</h2>
          <p>{account.credits.cycleLabel}</p>
          <div className="plan-state-row">
            <span><Check size={16} /> account linked</span>
            <span>{account.subscription.status === 'active' ? <Check size={16} /> : <X size={16} />} {account.subscription.status}</span>
            <span><RefreshCcw size={16} /> {account.subscription.renewalDate ? `renews ${new Date(account.subscription.renewalDate).toLocaleDateString()}` : 'no renewal scheduled'}</span>
          </div>
          <div className="button-row">
            <Link className="primary-button" href="/pricing">Compare plans</Link>
            <button className="secondary-disabled" disabled>Manage billing unavailable</button>
          </div>
        </article>

        <article className="lifecycle-card">
          <h2>How subscriptions work</h2>
          {lifecycle.map(([state, text], index) => (
            <div className="lifecycle-row" key={state}>
              <span>{index + 1}</span>
              <div><strong>{state}</strong><p>{text}</p></div>
            </div>
          ))}
        </article>
      </section>
    </ProductLayout>}</ProtectedAccount>
  )
}

export function CreditsPage() {
  return (
    <ProtectedAccount>{(account) => {
      const consumed = account.credits.events.filter((event) => event.type === 'consume').reduce((total, event) => total + Math.abs(event.amount), 0)
      const granted = account.credits.events.filter((event) => event.type === 'grant').reduce((total, event) => total + Math.abs(event.amount), 0)
      return <ProductLayout>
        <PageHeader
          eyebrow="Credit history"
          title="Your credits and recent activity."
          text="Review your available balance and the latest changes to your credits."
        />

        <section className="credit-summary-row">
          <article><span>Available</span><strong>{account.credits.available}</strong></article>
          <article><span>Added</span><strong>{granted}</strong></article>
          <article><span>Used</span><strong>{consumed}</strong></article>
          <article><span>Cycle</span><strong>{account.credits.cycleLabel}</strong></article>
        </section>

        <section className="ledger-table-card">
          <div className="table-heading"><ScanLine size={21} /><h2>Recent credit activity</h2></div>
          <div className="responsive-table">
            <table>
              <thead><tr><th>Date</th><th>Activity</th><th>Amount</th><th>Description</th><th>Reference</th></tr></thead>
              <tbody>
                {account.credits.events.map((event) => (
                  <tr key={event.id}>
                    <td>{new Date(event.createdAt).toLocaleDateString()}</td>
                    <td>{event.type}</td>
                    <td>{event.amount > 0 ? `+${event.amount}` : event.amount}</td>
                    <td>{event.description}</td>
                    <td>{event.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </ProductLayout>
    }}</ProtectedAccount>
  )
}

export function DataDeletionPage() {
  const scopes = [
    ['Account profile', 'Your name, email address, and account profile', 'Removed when your request is completed'],
    ['Your creations', 'Uploaded photos and generated coloring pages', 'Deleted according to the retention period shown at confirmation'],
    ['Orders and subscriptions', 'Order and subscription history', 'Some records may be kept when required by law'],
    ['Support history', 'Messages you sent to support', 'Kept only as long as needed to resolve your request'],
  ]

  return (
    <ProtectedAccount>{(account) => <ProductLayout>
      <PageHeader
        eyebrow="Account data deletion"
        title="Review what will be deleted."
        text="You can review the affected account data before submitting a deletion request."
      />

      <section className="deletion-layout">
        <article className="deletion-scope-card">
          <h2>Data included in your request</h2>
          {scopes.map(([area, data, rule]) => (
            <div className="deletion-scope-row" key={area}>
              <ShieldCheck size={19} />
              <div><h3>{area}</h3><p>{data}</p><span>{rule}</span></div>
            </div>
          ))}
        </article>

        <article className="deletion-request-card">
          <Trash2 size={25} />
          <h2>Request deletion</h2>
          <p>Current status: {account.deletionStatus === 'none' ? 'No deletion request' : account.deletionStatus}.</p>
          <button disabled>Deletion requests are temporarily unavailable</button>
          <Link href="/support">Contact support <ArrowRight size={16} /></Link>
        </article>
      </section>
    </ProductLayout>}</ProtectedAccount>
  )
}

export function CheckoutStatePage({ type }: { type: 'pending' | 'success' | 'cancel' }) {
  const config = {
    pending: {
      label: 'Payment pending',
      title: 'Your payment is being confirmed.',
      text: 'This usually takes a moment. Your plan and credits will update after confirmation.',
      action: 'View subscription',
      href: '/account/subscription',
    },
    success: {
      label: 'Return received',
      title: 'We received your checkout return.',
      text: 'Your subscription will appear in your account as soon as payment is confirmed.',
      action: 'View subscription',
      href: '/account/subscription',
    },
    cancel: {
      label: 'Checkout cancelled',
      title: 'Checkout was cancelled.',
      text: 'You were not charged and your plan was not changed.',
      action: 'Return to pricing',
      href: '/pricing',
    },
  }[type]

  const steps = [
    ['Checkout started', true],
    ['Returned to Linea', true],
    [type === 'cancel' ? 'Checkout cancelled' : 'Confirmation received', true],
    ['Payment confirmed', false],
    ['Account updated', false],
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
              <div className={done ? 'done' : ''} key={step as string}>
                {done ? <Check size={16} /> : <CircleAlert size={16} />}
                <code>{step}</code>
              </div>
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
