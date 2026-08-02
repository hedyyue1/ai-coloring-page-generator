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

function PageHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="subpage-header compact">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <span>{text}</span>
    </section>
  )
}

function PrototypeNotice() {
  return (
    <div className="prototype-banner">
      <CircleAlert size={18} />
      Static prototype data only. No real account, payment, generated result, or cross-device persistence is connected.
    </div>
  )
}

export function AccountPage() {
  const cards: Array<[string, string, string, LucideIcon]> = [
    ['Subscription', 'Free proposal · no paid subscription', '/account/subscription', BadgeCheck],
    ['Credit ledger', '20 sample credits · append-only events', '/account/credits', WalletCards],
    ['Payment states', 'Pending, return success, cancel, refund, dispute', '/checkout/pending', CreditCard],
    ['Data deletion', 'Review deletion scope before requesting', '/account/data-deletion', Trash2],
  ]

  return (
    <ProductLayout>
      <PageHeader
        eyebrow="Account prototype"
        title="Account overview and identity state."
        text="This page previews how an adult user would understand identity, entitlement, subscription, credits, and deletion boundaries."
      />
      <PrototypeNotice />

      <section className="account-summary-grid">
        <article className="account-identity-card">
          <div className="avatar-mark"><UserRound size={25} /></div>
          <div>
            <span>Demo internal user</span>
            <h2>account_demo_7f2c</h2>
            <p>Google subject linked · minimal identity only</p>
          </div>
        </article>
        <article className="account-metric-card">
          <span>Available credits</span>
          <strong>20</strong>
          <p>Free monthly proposal · sample cycle</p>
        </article>
        <article className="account-metric-card">
          <span>Subscription</span>
          <strong>Free</strong>
          <p>No paid checkout created</p>
        </article>
        <article className="account-metric-card warning">
          <span>Deletion</span>
          <strong>Not requested</strong>
          <p>Scope and backup rules pending approval</p>
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
    </ProductLayout>
  )
}

export function SubscriptionPage() {
  const lifecycle = [
    ['plan_selected', 'User chooses a fixed server-side SKU.'],
    ['checkout_intent_created', 'Expected amount, currency, grant, and user are stored.'],
    ['payment_sync_pending', 'Return page waits; no credits are granted.'],
    ['subscription_active', 'Verified webhook activates the plan and cycle grant.'],
    ['cancel_scheduled', 'Cancellation timing follows approved policy.'],
    ['refund_or_dispute_review', 'Ledger reversal waits for trusted evidence.'],
  ]

  return (
    <ProductLayout>
      <PageHeader
        eyebrow="Subscription prototype"
        title="Subscription and renewal control center."
        text="P0 shows Free as the current sample state. Paid checkout, cancellation, upgrade, downgrade, and proration remain disabled until approved."
      />
      <PrototypeNotice />

      <section className="subscription-panel">
        <article className="current-plan-card">
          <span>Current sample plan</span>
          <h2>Free · $0 / month</h2>
          <p>20 monthly coloring credits · Google account required · anti-abuse controls pending validation.</p>
          <div className="plan-state-row">
            <span><Check size={16} /> account linked</span>
            <span><X size={16} /> no paid renewal</span>
            <span><RefreshCcw size={16} /> cycle grant pending QA</span>
          </div>
          <div className="button-row">
            <Link className="primary-button" href="/pricing">Compare plans</Link>
            <button className="secondary-disabled" disabled>Cancel subscription unavailable</button>
          </div>
        </article>

        <article className="lifecycle-card">
          <h2>Lifecycle states</h2>
          {lifecycle.map(([state, text], index) => (
            <div className="lifecycle-row" key={state}>
              <span>{index + 1}</span>
              <div><code>{state}</code><p>{text}</p></div>
            </div>
          ))}
        </article>
      </section>
    </ProductLayout>
  )
}

export function CreditsPage() {
  const ledger = [
    ['ledger_1001', 'grant', '20', 'Free monthly proposal', 'cycle_2026_08'],
    ['ledger_1002', 'reserve', '1', 'Photo job preview', 'job_demo_01'],
    ['ledger_1003', 'consume', '1', 'Standard result delivered', 'job_demo_01'],
    ['ledger_1004', 'reserve', '1', 'Text job preview', 'job_demo_02'],
    ['ledger_1005', 'release', '1', 'Model timeout released reservation', 'job_demo_02'],
    ['ledger_1006', 'expire', '0', 'Cycle end rule pending approval', 'cycle_2026_08'],
  ]

  return (
    <ProductLayout>
      <PageHeader
        eyebrow="Credit ledger prototype"
        title="One shared balance with append-only events."
        text="Text and authorized photo jobs use the same coloring_credit. This page shows the ledger contract without exposing user content."
      />
      <PrototypeNotice />

      <section className="credit-summary-row">
        <article><span>Available</span><strong>19</strong></article>
        <article><span>Reserved</span><strong>0</strong></article>
        <article><span>Consumed</span><strong>1</strong></article>
        <article><span>Cycle</span><strong>Aug 2026</strong></article>
      </section>

      <section className="ledger-table-card">
        <div className="table-heading"><ScanLine size={21} /><h2>Sample entitlement ledger</h2></div>
        <div className="responsive-table">
          <table>
            <thead><tr><th>Ledger ID</th><th>Event</th><th>Amount</th><th>Reason</th><th>Reference</th></tr></thead>
            <tbody>
              {ledger.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </ProductLayout>
  )
}

export function DataDeletionPage() {
  const scopes = [
    ['Identity', 'Internal user, Google subject, necessary profile fields', 'Delete or anonymize according to approved policy'],
    ['User content', 'Uploaded inputs, generated results, delivery records', 'Retention and backup window pending validation'],
    ['Orders and subscriptions', 'External IDs, plan snapshots, tax/audit records', 'May require legal or accounting retention'],
    ['Logs and receipts', 'Webhook receipts, security events, support cases', 'Minimized and retained only for approved windows'],
  ]

  return (
    <ProductLayout>
      <PageHeader
        eyebrow="Account data deletion"
        title="Review what deletion means before requesting it."
        text="Deletion must distinguish identity, content, payment records, logs, backups, and third-party provider records. This prototype does not submit a request."
      />
      <PrototypeNotice />

      <section className="deletion-layout">
        <article className="deletion-scope-card">
          <h2>Deletion scope preview</h2>
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
          <p>Production deletion requires authentication, confirmation, retention disclosure, backup timing, and provider-boundary review.</p>
          <button disabled>Deletion backend pending approval</button>
          <Link href="/support">Go to support page <ArrowRight size={16} /></Link>
        </article>
      </section>
    </ProductLayout>
  )
}

export function CheckoutStatePage({ type }: { type: 'pending' | 'success' | 'cancel' }) {
  const config = {
    pending: {
      label: 'payment_sync_pending',
      title: 'Payment is being confirmed.',
      text: 'A hosted checkout return does not activate a plan. The interface waits for a verified, deduplicated webhook that matches user, SKU, amount, currency, and intent.',
      action: 'Preview account state',
      href: '/account/subscription',
    },
    success: {
      label: 'return_success',
      title: 'Return received — confirmation still pending.',
      text: 'This page intentionally avoids showing an active subscription or granted credits. It only confirms that the user returned from checkout.',
      action: 'View subscription prototype',
      href: '/account/subscription',
    },
    cancel: {
      label: 'return_cancel',
      title: 'Checkout was cancelled.',
      text: 'No payment, subscription, credit grant, or entitlement change was created. The user can safely return to pricing or support.',
      action: 'Return to pricing',
      href: '/pricing',
    },
  }[type]

  const steps = [
    ['checkout_intent_created', true],
    ['creem_hosted_checkout', true],
    [type === 'cancel' ? 'return_cancel' : type === 'success' ? 'return_success' : 'return_unknown', true],
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
