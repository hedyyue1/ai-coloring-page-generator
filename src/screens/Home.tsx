'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleAlert,
  CreditCard,
  FileText,
  Fingerprint,
  ScanLine,
  ShieldCheck,
  Type,
  UploadCloud,
  WalletCards,
  X,
} from 'lucide-react'
import ProductLayout from '../components/ProductLayout'
import ComparisonCard from '../components/ComparisonCard'

async function secureCheckout(planId: string) {
  const csrf = await fetch('/api/csrf', { cache: 'no-store' })
  if (!csrf.ok) return csrf
  const payload = await csrf.json() as { data?: { csrf_token?: string } }
  return fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json', 'X-CSRF-Token': payload.data?.csrf_token || '', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ plan_id: planId }) })
}

type WorkflowStep = {
  id: string
  label: string
  title: string
  status: string
  body: string
  ledger: Array<[string, string]>
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 'input',
    label: 'Authorized input',
    title: 'Confirm that the photo or idea is yours to use.',
    status: 'policy_checked',
    body:
      'The flow asks for an explicit rights confirmation and blocks student records, protected characters, public figures, and unauthorized uploads before a job starts.',
    ledger: [
      ['input.rights_confirmed', 'recorded'],
      ['job.policy_gate', 'passed'],
      ['credit.balance_changed', 'not yet'],
    ],
  },
  {
    id: 'identity',
    label: 'Google sign-in',
    title: 'Attach monthly credits to one internal account.',
    status: 'authenticated',
    body:
      'Google identity is used for account access only. The copy does not imply endorsement, age verification, ownership proof, or unrelated Google data access.',
    ledger: [
      ['auth.subject_verified', 'internal user'],
      ['free.monthly_entitlement', '20 credits'],
      ['scope.requested', 'openid email profile'],
    ],
  },
  {
    id: 'reserve',
    label: 'Reserve 1 credit',
    title: 'Make the deduction reversible before generation.',
    status: 'credit_reserved',
    body:
      'Text and authorized photo jobs share one balance. A reservation is visible before the job runs, so a failure never feels like a silent charge.',
    ledger: [
      ['credit.reserved', '1'],
      ['job.created', 'standard page'],
      ['balance.available', '19'],
    ],
  },
  {
    id: 'settle',
    label: 'Settle result',
    title: 'Consume on successful delivery, release on failure.',
    status: 'ledger_settled',
    body:
      'Only a persisted standard result consumes the credit. Rejection, timeout, duplicate callback, or model failure releases the reservation into the append-only ledger.',
    ledger: [
      ['delivery.persisted', 'consume 1'],
      ['job.failed', 'release 1'],
      ['ledger.mode', 'append-only'],
    ],
  },
]

const toolCards = [
  {
    icon: UploadCloud,
    eyebrow: 'Photo workflow',
    title: 'Image to Coloring Page',
    text: 'Upload an adult-owned photo, confirm usage rights, preview the reservation, then generate one standard page.',
    meta: '1 credit on success',
    href: '/photo-to-coloring-page',
  },
  {
    icon: Type,
    eyebrow: 'Original text',
    title: 'Text to Coloring Page',
    text: 'Write an original family, classroom, seasonal, or activity theme without uploading student PII.',
    meta: 'Shared credit balance',
    href: '/text-to-coloring-page',
  },
  {
    icon: WalletCards,
    eyebrow: 'Account state',
    title: 'Credit Ledger Preview',
    text: 'See grant, reserve, consume, release, expire, refund reversal, and cycle state in one auditable view.',
    meta: 'Append-only events',
    href: '/account',
  },
]

const plans = [
  { id: null, name: 'Free', price: '$0', credits: '20', fit: 'Controlled first experience after Google sign-in', featured: false },
  { id: 'starter_monthly', name: 'Starter', price: '$9.99', credits: '200', fit: 'Occasional family or classroom preparation', featured: false },
  { id: 'standard_monthly', name: 'Standard', price: '$19.99', credits: '500', fit: 'Frequent household, homeschool, or teacher use', featured: true },
  { id: 'premium_monthly', name: 'Premium', price: '$39.99', credits: '1,500', fit: 'High-frequency adult activity organizers', featured: false },
]

const states = [
  ['sign_in_cancelled', 'No entitlement or checkout is created.'],
  ['payment_sync_pending', 'Return URLs never grant credits.'],
  ['renewal_failed', 'Past-due state waits for a trusted event.'],
  ['cancel_scheduled', 'Effective timing follows approved policy.'],
  ['refund_pending', 'Ledger reversal waits for confirmation.'],
  ['dispute_open', 'Entitlement review restores or revokes access.'],
]

const faqs = [
  [
    'Why does this product require sign-in?',
    'Monthly credits belong to an account. Sign-in makes balance, reservation, release, renewal, cancellation, refund, and dispute states explainable. It is not presented as endorsement, age verification, or proof of image rights.',
  ],
  [
    'What is one coloring_credit?',
    'One credit represents one successfully delivered standard coloring activity page from an authorized photo or original text. Text and image jobs share one balance; failed jobs release the reservation.',
  ],
  [
    'Is Free unlimited or available without an account?',
    'No. The V5 proposal is 20 monthly credits attached to a Google account, with anti-abuse controls and cost validation still required.',
  ],
  [
    'When does a Waffo payment activate a plan?',
    'Only after a verified, deduplicated webhook matches the expected user, SKU, amount, currency, and checkout intent. A return page can only show that payment confirmation is pending.',
  ],
  [
    'Can teachers upload student materials?',
    'No student accounts, rosters, names, photos, grades, or sensitive school records. Adults may prepare general original themes for classroom use.',
  ],
  [
    'Are download format, watermark, and retention decided?',
    'Not yet. They remain validation items, so the interface avoids promising unlimited downloads, no watermark, 4K, privacy, or commercial rights.',
  ],
]

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="section-heading">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      {text ? <span>{text}</span> : null}
    </div>
  )
}

function WorkflowPanel() {
  const [activeId, setActiveId] = useState(workflowSteps[0].id)
  const active = useMemo(
    () => workflowSteps.find((step) => step.id === activeId) ?? workflowSteps[0],
    [activeId],
  )

  return (
    <div className="workflow-console">
      <div className="workflow-tabs" role="tablist" aria-label="P0 workflow states">
        {workflowSteps.map((step, index) => (
          <button
            key={step.id}
            className={step.id === active.id ? 'workflow-tab active' : 'workflow-tab'}
            onClick={() => setActiveId(step.id)}
            role="tab"
            aria-selected={step.id === active.id}
          >
            <span>{index + 1}</span>
            {step.label}
          </button>
        ))}
      </div>
      <article className="workflow-detail">
        <div>
          <p className="detail-status">{active.status}</p>
          <h3>{active.title}</h3>
          <p>{active.body}</p>
        </div>
        <div className="ledger-card">
          <div><ScanLine size={17} /> Append-only ledger</div>
          {active.ledger.map(([event, value]) => (
            <p key={event}><code>{event}</code><span>{value}</span></p>
          ))}
        </div>
      </article>
    </div>
  )
}

function PricingCard({ plan, busyPlan, onChoose }: { plan: (typeof plans)[number]; busyPlan: string | null; onChoose: (planId: string) => void }) {
  return (
    <article className={plan.featured ? 'price-card featured' : 'price-card'}>
      {plan.featured ? <span className="popular-badge">Popular · only one</span> : null}
      <div className="plan-heading">
        <h3>{plan.name}</h3>
        <span>monthly</span>
      </div>
      <div className="plan-price"><strong>{plan.price}</strong><span>USD / month</span></div>
      <p><b>{plan.credits}</b> monthly coloring credits</p>
      <p className="plan-fit">{plan.fit}</p>
      <ul>
        <li><Check size={15} /> Shared credit definition</li>
        <li><Check size={15} /> Failure releases reservation</li>
        <li><Check size={15} /> Entitlement requires a verified webhook</li>
      </ul>
      {plan.id ? (
        <button
          className={plan.featured ? 'plan-cta primary' : 'plan-cta'}
          disabled={busyPlan !== null}
          onClick={() => onChoose(plan.id!)}
        >
          {busyPlan === plan.id ? 'Opening secure checkout…' : `Choose ${plan.name}`}
        </button>
      ) : <Link className="plan-cta" href="/login">Start free</Link>}
    </article>
  )
}

export default function Home() {
  const [busyPlan, setBusyPlan] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState('')

  async function beginCheckout(planId: string) {
    setBusyPlan(planId)
    setCheckoutError('')
    try {
      const response = await secureCheckout(planId)
      const result = await response.json() as { data?: { checkout_url?: string }; checkout_url?: string; error?: { message?: string } }
      if (response.status === 401) {
        window.location.assign(`/api/auth/google/start?returnTo=${encodeURIComponent(`/?plan=${planId}#pricing`)}`)
        return
      }
      const checkoutUrl = result.data?.checkout_url || result.checkout_url
      if (!response.ok || !checkoutUrl) throw new Error(result.error?.message || 'Checkout is temporarily unavailable.')
      window.location.assign(checkoutUrl)
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Checkout is temporarily unavailable.')
      setBusyPlan(null)
    }
  }

  return (
    <ProductLayout>
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="hero-kicker">AI Coloring Page Generator · adult-focused</p>
          <h1>Turn an <span>authorized photo</span> or original idea into one coloring activity page.</h1>
          <p className="hero-subtitle">
            A guided workflow with clear monthly credits and account status before they apply.
          </p>
          <div className="hero-actions">
            <Link href="/photo-to-coloring-page" className="primary-button">Start with a photo <ArrowRight size={18} /></Link>
            <Link href="/account" className="secondary-button">See how credits work</Link>
          </div>
          <div className="hero-assurance">
            <span><Fingerprint size={15} /> Google sign-in for account only</span>
            <span><ShieldCheck size={15} /> Rights confirmation before upload</span>
          </div>
        </div>
        <ComparisonCard />
      </section>

      <section className="tool-strip" aria-label="Core tools">
        {toolCards.map((tool) => {
          const Icon = tool.icon
          return (
            <Link className="tool-card" href={tool.href} key={tool.title}>
              <div className="tool-icon"><Icon size={23} /></div>
              <span>{tool.eyebrow}</span>
              <h2>{tool.title}</h2>
              <p>{tool.text}</p>
              <strong>{tool.meta}</strong>
            </Link>
          )
        })}
      </section>

      <section className="panel-section" id="workflow">
        <SectionHeading
          eyebrow="How it works"
          title="A tool-style flow with ledger states built in."
          text="The familiar generator pattern is retained, but every critical transition is named and inspectable."
        />
        <WorkflowPanel />
      </section>

      <section className="credit-panel" id="credits">
        <div className="credit-copy">
          <p className="hero-kicker">One credit contract</p>
          <h2>One successful standard page consumes one credit. Failure releases it.</h2>
          <p>
            No split text bucket, hidden image multiplier, return-url activation, or silent deduction. The append-only ledger is the product’s source of truth.
          </p>
        </div>
        <div className="credit-events">
          <span>grant</span><ArrowRight size={15} />
          <span>reserve</span><ArrowRight size={15} />
          <span>consume</span><ArrowRight size={15} />
          <span>release</span><ArrowRight size={15} />
          <span>expire</span>
        </div>
      </section>

      <section className="panel-section boundary-section">
        <SectionHeading
          eyebrow="Input boundary"
          title="Designed for adults preparing one meaningful page."
        />
        <div className="boundary-grid">
          <article>
            <ShieldCheck size={23} />
            <h3>Allowed with confirmation</h3>
            <p>Adult-owned family photos, original written themes, general classroom topics, and non-sensitive activity ideas.</p>
          </article>
          <article>
            <X size={23} />
            <h3>Not allowed in P0</h3>
            <p>Student PII, unauthorized images, protected characters, public figures, sensitive data, batch books, teams, or commercial promises.</p>
          </article>
          <article>
            <BadgeCheck size={23} />
            <h3>Verified before claimed</h3>
            <p>Format, retention, downloads, watermark, fairness limits, cancellation, refund, and regional payment details wait for approved evidence.</p>
          </article>
        </div>
      </section>

      <section className="panel-section pricing-section" id="pricing">
        <SectionHeading
          eyebrow="Pricing · Waffo Test checkout"
          title="Four monthly tiers, Standard as the single recommendation."
          text="Choose a paid plan to open secure Waffo checkout. Sign-in is required before a checkout can be created."
        />
        <div className="pricing-grid">
          {plans.map((plan) => <PricingCard key={plan.name} plan={plan} busyPlan={busyPlan} onChoose={beginCheckout} />)}
        </div>
        {checkoutError ? <p className="prototype-alert"><CircleAlert size={16} /> {checkoutError}</p> : null}
        <div className="pricing-note">
          <CreditCard size={18} />
          Paid tiers renew monthly. Credits are activated only after a verified Waffo webhook confirms payment.
        </div>
      </section>

      <section className="panel-section states-section">
        <SectionHeading
          eyebrow="Account states"
          title="Edge cases get their own visible interface."
        />
        <div className="state-grid">
          {states.map(([state, text]) => (
            <article key={state}>
              <code>{state}</code>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-section faq-section" id="faq">
        <SectionHeading
          eyebrow="FAQ"
          title="Clear answers before someone trusts the workflow."
        />
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <details key={question}>
              <summary>
                <span>{index + 1}</span>
                {question}
                <ChevronDown size={18} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div>
          <p>Ready when the evidence is</p>
          <h2>Start with an authorized photo — keep every account state explainable.</h2>
        </div>
        <Link href="/photo-to-coloring-page">Open photo workflow <ArrowRight size={18} /></Link>
      </section>

      <footer className="footer-bar">
        <span>Linea · adult-focused coloring workflow prototype</span>
        <span><FileText size={14} /> Policy pages are reachable from the sidebar</span>
      </footer>
    </ProductLayout>
  )
}
