'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,

  CreditCard,
  FileText,
  Fingerprint,

  ShieldCheck,
  Type,
  UploadCloud,
  WalletCards,
  X,
} from 'lucide-react'
import ProductLayout from '../components/ProductLayout'
import ComparisonCard from '../components/ComparisonCard'

const workflowSteps = [
  {
    id: 'input',
    label: 'Choose your photo',
    title: 'Choose a photo you own or have permission to use.',
    body: 'Confirm that you are an adult and have permission to use the photo. Do not use student information, sensitive material, protected characters or public figures.',
    visual: '/workflow/choose-photo.svg',
    visualAlt: 'Illustration of an adult selecting a permitted photo for a coloring-page preview',
  },
  {
    id: 'identity',
    label: 'Google sign-in',
    title: 'Sign in to view your account',
    body: 'Google sign-in identifies your account. It does not verify your age or permission to use a photo.',
    visual: '/workflow/google-sign-in.svg',
    visualAlt: 'Illustration of the Google sign-in step used to access an account',
  },
  {
    id: 'preview',
    label: 'Create your preview',
    title: 'Create your preview',
    body: 'The current photo preview is created in your browser and does not deduct credits. A generated PNG copy is sent to our server for download and may contain recognizable details.',
    visual: '/workflow/create-preview.svg',
    visualAlt: 'Illustration of a photo being converted into a coloring-page preview',
  },
  {
    id: 'result',
    label: 'Check your result',
    title: 'Check your result and download access',
    body: 'Review the result before printing. PNG downloads require Google sign-in and an eligible subscription. New purchases are unavailable. Download access expires after 24 hours; this does not mean every stored copy has been deleted.',
    visual: '/workflow/check-result.svg',
    visualAlt: 'Illustration of reviewing and downloading a completed coloring-page result',
  },
]

const toolCards = [
  {
    icon: UploadCloud,
    eyebrow: 'Photo preview',
    title: 'Photo to Coloring Page',
    text: 'Choose a photo you have permission to use and create a browser-based preview. A generated copy is sent to our server for download.',
    meta: 'Creating the current photo preview does not use credits.',
    href: '/photo-to-coloring-page',
  },
  {
    icon: Type,
    eyebrow: 'Text themes',
    title: 'Text to Coloring Page',
    text: 'Text-to-coloring generation is currently unavailable. Do not enter student information or sensitive details.',
    meta: 'Text generation unavailable',
    href: '/text-to-coloring-page',
  },
  {
    icon: WalletCards,
    eyebrow: 'Your account',
    title: 'Your credits',
    text: 'View your available balance and recent credit activity. For billing or balance questions, contact Support.',
    meta: 'Recent credit activity',
    href: '/account',
  },
]

const exampleCards = [
  {
    src: '/examples/garden-cottage.svg',
    title: 'Garden cottage',
    alt: 'Original split illustration of a colorful garden cottage beside a black-and-white line-art version',
  },
  {
    src: '/examples/cozy-cat.svg',
    title: 'Cozy cat',
    alt: 'Original split illustration of a colorful cat on a cushion beside a black-and-white line-art version',
  },
  {
    src: '/examples/camping-memory.svg',
    title: 'Camping memory',
    alt: 'Original split illustration of a colorful mountain campsite beside a black-and-white line-art version',
  },
]

const plans = [
  { id: null, name: 'Free', price: '$0', credits: '20', fit: 'For getting started with Google sign-in', featured: false },
  { id: 'starter_monthly', name: 'Starter', price: '$9.99', credits: '200', fit: 'Occasional family or classroom preparation', featured: false },
  { id: 'standard_monthly', name: 'Standard', price: '$19.99', credits: '500', fit: 'Frequent household, homeschool, or teacher use', featured: true },
  { id: 'premium_monthly', name: 'Premium', price: '$39.99', credits: '1,500', fit: 'High-frequency adult activity organizers', featured: false },
]

const states = [
  ['Sign-in not completed', 'You can return and try signing in again.'],
  ['Payment confirmation pending', 'Check your account before attempting another payment.'],
  ['Renewal not confirmed', 'Contact Support if your access or balance is not what you expected.'],
  ['Cancellation requested', 'Ask Support to confirm whether cancellation is complete and when it takes effect.'],
  ['Refund review requested', 'A request does not mean a refund has been approved or paid.'],
  ['Payment dispute', 'Contact Support for information about your account.'],
]

const faqs = [
  [
    'Why sign in with Google?',
    'Google sign-in lets you view your account and request an eligible download. It does not verify your age or your rights to a photo.',
  ],
  [
    'What is a coloring credit?',
    'The monthly plans use credits for coloring pages. The current browser-based photo preview does not deduct credits; text generation is unavailable.',
  ],
  [
    'What does the Free plan include?',
    'The Free plan allowance is 20 credits per month and requires Google sign-in. Current photo previews do not deduct credits. Free does not mean unlimited use or permanent storage.',
  ],
  [
    'How do I check payment and subscription access?',
    'Returning from checkout is not payment confirmation. Check Account for your subscription status and contact Support if access is missing. Do not pay again to fix a missing status.',
  ],
  [
    'Can teachers upload student materials?',
    'No student accounts, rosters, names, photos, grades, or sensitive school records. Adults may prepare general original themes for classroom use.',
  ],
  [
    'What should I know about downloads and storage?',
    'A generated PNG copy is sent to our server for download. Download access expires after 24 hours; this does not mean every stored copy has been deleted. Downloads require Google sign-in and an eligible subscription.',
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
      <div className="workflow-tabs" role="tablist" aria-label="Photo preview steps">
        {workflowSteps.map((step, index) => (
          <button
            key={step.id}
            id={`workflow-tab-${step.id}`}
            className={step.id === active.id ? 'workflow-tab active' : 'workflow-tab'}
            onClick={() => setActiveId(step.id)}
            type="button"
            role="tab"
            aria-controls={`workflow-panel-${step.id}`}
            aria-selected={step.id === active.id}
          >
            <span>{index + 1}</span>
            {step.label}
          </button>
        ))}
      </div>
      <article
        className="workflow-detail"
        id={`workflow-panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`workflow-tab-${active.id}`}
      >
        <div className="workflow-copy">
          <h3>{active.title}</h3>
          <p>{active.body}</p>
        </div>
        <figure className="workflow-visual" key={active.id}>
          <Image
            src={active.visual}
            alt={active.visualAlt}
            width={720}
            height={420}
            sizes="(max-width: 900px) 100vw, 46vw"
          />
        </figure>
      </article>
    </div>
  )
}

function PricingCard({ plan }: { plan: (typeof plans)[number] }) {
  return (
    <article className={plan.featured ? 'price-card featured' : 'price-card'}>
      {plan.featured ? <span className="popular-badge">Recommended</span> : null}
      <div className="plan-heading">
        <h3>{plan.name}</h3>
        <span>monthly</span>
      </div>
      <div className="plan-price"><strong>{plan.price}</strong><span>USD / month</span></div>
      <p><b>{plan.credits}</b> monthly coloring credits</p>
      <p className="plan-fit">{plan.fit}</p>
      <ul>
        <li><Check size={15} /> View your credits in Account</li>
        <li><Check size={15} /> Current photo previews do not deduct credits.</li>
        <li><Check size={15} /> Check your account for confirmed access.</li>
      </ul>
      {plan.id ? (
        <button className={plan.featured ? 'plan-cta primary' : 'plan-cta'} disabled>New purchases unavailable</button>
      ) : <Link className="plan-cta" href="/photo-to-coloring-page">Create a photo preview</Link>}
    </article>
  )
}

export default function Home() {


  return (
    <ProductLayout>
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="hero-kicker">Photo to Coloring Page · for adults</p>
          <h1>Turn a <span>photo you have permission to use</span> into a coloring-page preview.</h1>
          <p className="hero-subtitle">
            Create a photo preview. Downloads require Google sign-in and an eligible subscription; new purchases are currently unavailable.
          </p>
          <div className="hero-actions">
            <Link href="/photo-to-coloring-page" className="primary-button">Start with a photo <ArrowRight size={18} /></Link>
            <Link href="/account" className="secondary-button">See how credits work</Link>
          </div>
          <div className="hero-assurance">
            <span><Fingerprint size={15} /> Use Google to access your account</span>
            <span><ShieldCheck size={15} /> Use only photos you own or have permission to use.</span>
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
          title="How to create a photo preview"
          text="Choose a permitted photo, confirm your rights and create a preview. Check download requirements before continuing."
        />
        <WorkflowPanel />
      </section>

      <section className="panel-section examples-section" id="examples">
        <SectionHeading
          eyebrow="Illustrative examples"
          title="See the idea before you use your own photo"
          text="These are original illustrations showing the kind of before-and-line-art comparison you can expect. They are examples, not generated customer results."
        />
        <div className="example-grid">
          {exampleCards.map((example) => (
            <figure className="example-card" key={example.title}>
              <Image
                src={example.src}
                alt={example.alt}
                width={800}
                height={560}
                sizes="(max-width: 900px) 100vw, 33vw"
              />
              <figcaption>
                <strong>{example.title}</strong>
                <span>Color reference → printable line-art concept</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="examples-cta">
          <p>Ready to try a photo you own or have permission to use?</p>
          <Link href="/photo-to-coloring-page" className="primary-button">Create a photo preview <ArrowRight size={18} /></Link>
        </div>
      </section>

      <section className="credit-panel" id="credits">
        <div className="credit-copy">
          <p className="hero-kicker">Photo previews and credits</p>
          <h2>Current photo previews do not deduct credits.</h2>
          <p>
            View your current balance in Account. Returning from checkout does not confirm a payment.
          </p>
        </div>

      </section>

      <section className="panel-section boundary-section">
        <SectionHeading
          eyebrow="Choose suitable content"
          title="Designed for adults preparing one meaningful page."
        />
        <div className="boundary-grid">
          <article>
            <ShieldCheck size={23} />
            <h3>Photos you can use</h3>
            <p>Photos you have permission to use, without student information or sensitive details. Text generation is currently unavailable.</p>
          </article>
          <article>
            <X size={23} />
            <h3>What not to submit</h3>
            <p>Do not use student information, sensitive details, unauthorized images, protected characters or public figures. This service does not include batch creation, team accounts or commercial publishing permission.</p>
          </article>
          <article>
            <BadgeCheck size={23} />
            <h3>Know what is included</h3>
            <p>Current photo results are PNG previews. Downloads require Google sign-in and an eligible subscription. For cancellation, refund or privacy requests, visit Support.</p>
          </article>
        </div>
      </section>

      <section className="panel-section pricing-section" id="pricing">
        <SectionHeading
          eyebrow="Monthly plans — new purchases unavailable"
          title="Compare monthly plans"
          text="New purchases are currently unavailable. You can compare monthly plans below; no purchase can be made here."
        />
        <div className="pricing-grid">
          {plans.map((plan) => <PricingCard key={plan.name} plan={plan} />)}
        </div>

        <div className="pricing-note">
          <CreditCard size={18} />
          These paid plans are monthly subscriptions. New purchases are unavailable. Before any purchase becomes available, review renewal, cancellation and total-price details.
        </div>
      </section>

      <section className="panel-section states-section">
        <SectionHeading
          eyebrow="Account and payment help"
          title="Need help with your account?"
          text="These are help topics, not your current account status. Visit Account for your details or contact Support."
        />
        <div className="state-grid">
          {states.map(([state, text]) => (
            <article key={state}>
              <h3>{state}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-section faq-section" id="faq">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions about previews, downloads and your account"
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
          <p>Create a photo preview</p>
          <h2>Start with a photo you have permission to use.</h2>
        </div>
        <Link href="/photo-to-coloring-page">Try the photo preview <ArrowRight size={18} /></Link>
      </section>

      <footer className="footer-bar">
        <span>Linea · coloring activities for adults</span>
        <span><FileText size={14} /> <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/acceptable-use">Acceptable Use</Link> · <Link href="/refunds">Refunds and cancellation</Link> · <Link href="/support">Support</Link> · <Link href="/account">Account and data requests</Link></span>
      </footer>
    </ProductLayout>
  )
}
