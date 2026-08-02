'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
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
    label: 'Choose your input',
    title: 'Start with a photo or an original idea.',
    status: 'Ready to review',
    body: 'Choose a photo you are allowed to use or write an original idea, then confirm that it does not contain private student information or restricted content.',
    ledger: [
      ['Usage rights', 'confirmed'],
      ['Content check', 'passed'],
      ['Credits used', 'none'],
    ],
  },
  {
    id: 'identity',
    label: 'Sign in',
    title: 'Keep your credits connected to one account.',
    status: 'Account secured',
    body: 'Google sign-in identifies your Linea account. Linea does not request access to your photos, files, email, or contacts.',
    ledger: [
      ['Account', 'connected'],
      ['Monthly credits', '20'],
      ['Requested details', 'name and email'],
    ],
  },
  {
    id: 'reserve',
    label: 'Hold 1 credit',
    title: 'Your credit stays protected while the page is created.',
    status: 'Credit held',
    body: 'Photo and text tools share one balance. One credit is held while Linea creates your page, so it can be returned automatically if the request fails.',
    ledger: [
      ['Credit held', '1'],
      ['Page type', 'standard'],
      ['Available balance', '19'],
    ],
  },
  {
    id: 'settle',
    label: 'Receive your page',
    title: 'Use one credit only after a page is completed.',
    status: 'Request complete',
    body: 'A completed coloring page uses one credit. If the request is rejected, times out, or fails, the held credit returns to your balance.',
    ledger: [
      ['Page completed', 'use 1 credit'],
      ['Request failed', 'return 1 credit'],
      ['Balance', 'updated'],
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
    eyebrow: 'Plans and credits',
    title: 'Simple Monthly Credits',
    text: 'Compare plans and see how credits are held, used, or returned for every request.',
    meta: 'Clear credit rules',
    href: '/pricing',
  },
]

const plans = [
  { name: 'Free', price: '$0', credits: '20', fit: 'Controlled first experience after Google sign-in' },
  { name: 'Starter', price: '$9.99', credits: '200', fit: 'Occasional family or classroom preparation' },
  { name: 'Standard', price: '$19.99', credits: '500', fit: 'Frequent household, homeschool, or teacher use', featured: true },
  { name: 'Premium', price: '$39.99', credits: '1,500', fit: 'High-frequency adult activity organizers' },
]

const states = [
  ['Sign-in cancelled', 'Return safely and try again when you are ready.'],
  ['Payment pending', 'Your plan updates after payment is confirmed.'],
  ['Renewal issue', 'Your account shows what needs attention.'],
  ['Cancellation scheduled', 'Your access continues through the date shown.'],
  ['Refund pending', 'Your account updates after the refund is confirmed.'],
  ['Payment disputed', 'Your plan and credits remain visible during review.'],
]

const faqs = [
  [
    'Why does this product require sign-in?',
    'Monthly credits belong to an account. Sign-in makes balance, reservation, release, renewal, cancellation, refund, and dispute states explainable. It is not presented as endorsement, age verification, or proof of image rights.',
  ],
  [
    'What does one credit create?',
    'One credit represents one successfully delivered standard coloring activity page from an authorized photo or original text. Text and image jobs share one balance; failed jobs release the reservation.',
  ],
  [
    'Is Free unlimited or available without an account?',
    'No. The Free plan includes 20 monthly credits connected to your account.',
  ],
  [
    'When does a payment activate a plan?',
    'Your plan activates after the payment is confirmed. The checkout return page may briefly show that confirmation is still pending.',
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
      <div className="workflow-tabs" role="tablist" aria-label="How Linea works">
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
          <div><ScanLine size={17} /> What happens</div>
          {active.ledger.map(([event, value]) => (
            <p key={event}><code>{event}</code><span>{value}</span></p>
          ))}
        </div>
      </article>
    </div>
  )
}

function PricingCard({ plan }: { plan: (typeof plans)[number] }) {
  return (
    <article className={plan.featured ? 'price-card featured' : 'price-card'}>
      {plan.featured ? <span className="popular-badge">Popular · only one</span> : null}
      <div className="plan-heading">
        <h3>{plan.name}</h3>
        <span>monthly plan</span>
      </div>
      <div className="plan-price"><strong>{plan.price}</strong><span>USD / month</span></div>
      <p><b>{plan.credits}</b> monthly coloring credits</p>
      <p className="plan-fit">{plan.fit}</p>
      <ul>
        <li><Check size={15} /> One balance for both tools</li>
        <li><Check size={15} /> Failed requests return the credit</li>
        <li><Check size={15} /> Credits refresh monthly</li>
      </ul>
      <button disabled>Subscribe</button>
    </article>
  )
}

export default function Home() {
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
            <Link href="/pricing" className="secondary-button">See how credits work</Link>
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
          title="A clear four-step path from idea to coloring page."
          text="See when your input is checked, when a credit is held, and when it is returned or used."
        />
        <WorkflowPanel />
      </section>

      <section className="credit-panel" id="credits">
        <div className="credit-copy">
          <p className="hero-kicker">One simple credit rule</p>
          <h2>One successful standard page consumes one credit. Failure releases it.</h2>
          <p>
            Photo and text requests share one balance. A failed request returns the held credit automatically, so your balance stays easy to understand.
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
            <h3>Not allowed</h3>
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
          eyebrow="Pricing"
          title="Four monthly tiers, Standard as the single recommendation."
          text="Compare four simple monthly plans. Paid subscriptions are coming soon."
        />
        <div className="pricing-grid">
          {plans.map((plan) => <PricingCard key={plan.name} plan={plan} />)}
        </div>
        <div className="pricing-note">
          <CreditCard size={18} />
          Paid tiers renew monthly. Final checkout details, cancellation options, and refund information will be shown before purchase.
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
          <p>Ready to create?</p>
          <h2>Start with a photo you are allowed to use or an original idea.</h2>
        </div>
        <Link href="/photo-to-coloring-page">Open photo workflow <ArrowRight size={18} /></Link>
      </section>

      <footer className="footer-bar">
        <span>Linea · AI coloring pages for adults, families, and educators</span>
        <span><FileText size={14} /> Privacy, terms, and support</span>
      </footer>
    </ProductLayout>
  )
}
