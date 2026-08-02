'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, CalendarDays, Check, Clock3, Trash2, UserRound, WalletCards } from 'lucide-react'
import ProductLayout from '@/components/ProductLayout'
import PageHeader from '@/components/PageHeader'
import ProtectedAccount from '@/auth/ProtectedAccount'
import type { AccountSession } from '@/auth/session'

function Overview({ account }: { account: AccountSession }) {
  const { user, credits, subscription, deletionStatus } = account
  const deletionLabel = deletionStatus === 'none' ? 'Not requested' : deletionStatus === 'requested' ? 'Requested' : 'In progress'
  return <ProductLayout><div className="page-shell">
    <PageHeader eyebrow="Your account" title={`Welcome back, ${user.name}.`} text="Manage your profile, plan, credits, and privacy settings." />
    <section className="account-summary-grid">
      <article className="identity-card"><div className="avatar-mark">{user.avatarUrl ? <Image src={user.avatarUrl} alt="" width={48} height={48} /> : <UserRound size={25} />}</div><div><span>{user.name}</span><h2>{user.email}</h2><p>Account ID: {user.id}</p></div></article>
      <article className="account-metric-card"><WalletCards size={21}/><span>Available credits</span><strong>{credits.available}</strong><p>{credits.cycleLabel}</p></article>
      <article className="account-metric-card"><BadgeCheck size={21}/><span>Plan</span><strong>{subscription.plan}</strong><p>{subscription.status === 'active' ? subscription.priceLabel : 'No active subscription'}</p></article>
      <article className="account-metric-card"><Trash2 size={21}/><span>Deletion</span><strong>{deletionLabel}</strong><p>Manage your data and privacy choices</p></article>
    </section>
    <section className="account-link-grid">
      <Link href="/account/subscription"><BadgeCheck/><div><h3>Subscription</h3><p>View your current plan and renewal details.</p></div><ArrowRight/></Link>
      <Link href="/account/credits"><WalletCards/><div><h3>Credit history</h3><p>Review credit usage and activity.</p></div><ArrowRight/></Link>
      <Link href="/account/data-deletion"><Trash2/><div><h3>Data & privacy</h3><p>Learn about data deletion and retention.</p></div><ArrowRight/></Link>
    </section>
  </div></ProductLayout>
}

export function AccountPage() { return <ProtectedAccount>{account => <Overview account={account}/>}</ProtectedAccount> }
export const AccountOverview = AccountPage

function Subscription({ account }: { account: AccountSession }) {
  const { subscription } = account
  const active = subscription.status === 'active' || subscription.status === 'trialing'
  return <ProductLayout><div className="page-shell">
    <PageHeader eyebrow="Subscription" title="Your plan" text="Review your plan, billing status, and renewal details." />
    <section className="subscription-panel"><article className="current-plan-card"><span>Current plan</span><h2>{subscription.plan}</h2><p>{subscription.priceLabel}</p><div className="plan-state-row"><span><Check size={16}/> {active ? 'Active' : 'No active subscription'}</span>{subscription.renewalDate && <span><CalendarDays size={16}/> Renews {new Date(subscription.renewalDate).toLocaleDateString()}</span>}</div><div className="button-row"><Link className="primary-button" href="/pricing">Compare plans</Link></div></article></section>
  </div></ProductLayout>
}
export function SubscriptionPage() { return <ProtectedAccount>{account => <Subscription account={account}/>}</ProtectedAccount> }

function Credits({ account }: { account: AccountSession }) {
  const { credits } = account
  return <ProductLayout><div className="page-shell">
    <PageHeader eyebrow="Credits" title="Credit history" text="See your current balance and recent credit activity." />
    <section className="credit-summary-row"><article><span>Available</span><strong>{credits.available}</strong></article><article><span>Reserved</span><strong>{credits.reserved}</strong></article><article><span>Used this cycle</span><strong>{credits.usedThisCycle}</strong></article></section>
    <section className="ledger-table-card"><div className="table-heading"><WalletCards size={21}/><h2>Recent activity</h2></div>{credits.events.length ? <div className="responsive-table"><table><thead><tr><th>Date</th><th>Activity</th><th>Credits</th><th>Description</th></tr></thead><tbody>{credits.events.map(event => <tr key={event.id}><td>{new Date(event.createdAt).toLocaleDateString()}</td><td>{event.type}</td><td>{event.amount}</td><td>{event.description}</td></tr>)}</tbody></table></div> : <div className="empty-state"><Clock3 size={24}/><h3>No credit activity yet</h3><p>Your grants and usage will appear here.</p></div>}</section>
  </div></ProductLayout>
}
export function CreditsPage() { return <ProtectedAccount>{account => <Credits account={account}/>}</ProtectedAccount> }

function DataDeletion({ account }: { account: AccountSession }) {
  const requested = account.deletionStatus !== 'none'
  return <ProductLayout><div className="page-shell"><PageHeader eyebrow="Data & privacy" title="Delete your account data" text="Review what happens before requesting account deletion." />
    <section className="deletion-grid"><article className="deletion-summary"><Trash2 size={26}/><h2>{requested ? 'Deletion request received' : 'Request account deletion'}</h2><p>{requested ? 'We are processing your request. Some transaction records may be retained where required by law.' : 'Deleting your account removes your profile and associated creations. Some billing or security records may need to be retained for legal reasons.'}</p>{requested ? <span className="status-pill"><span/> {account.deletionStatus}</span> : <Link className="primary-button" href="/support">Contact support to request deletion <ArrowRight size={16}/></Link>}</article></section>
  </div></ProductLayout>
}
export function DataDeletionPage() { return <ProtectedAccount>{account => <DataDeletion account={account}/>}</ProtectedAccount> }

export function CheckoutStatePage({ type }: { type: 'pending' | 'success' | 'cancel' }) {
  const copy = type === 'cancel'
    ? { eyebrow: 'Payment cancelled', title: 'Your checkout was cancelled.', text: 'You were not charged. You can return to pricing whenever you are ready.', action: 'Back to pricing', href: '/pricing' }
    : type === 'success'
      ? { eyebrow: 'Payment received', title: 'We are confirming your payment.', text: 'This usually takes only a moment. Your plan will update automatically after confirmation.', action: 'View account', href: '/account/subscription' }
      : { eyebrow: 'Payment pending', title: 'Your payment is still being confirmed.', text: 'You can safely leave this page and check your account again in a few minutes.', action: 'View account', href: '/account/subscription' }
  return <ProductLayout><div className="page-shell"><section className="checkout-state-card"><Clock3 size={30}/><p className="hero-kicker">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.text}</p><Link className="primary-button" href={copy.href}>{copy.action}<ArrowRight size={16}/></Link></section></div></ProductLayout>
}
