'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CircleAlert,
  CreditCard,
  LogIn,
  ScanLine,
  Type,
  UploadCloud,
} from 'lucide-react'
import ProductLayout from '../components/ProductLayout'
import ComparisonCard from '../components/ComparisonCard'

const planRows = [
  { name: 'Free', price: '$0', credits: '20', renewal: 'No paid renewal', fit: 'Controlled first experience', featured: false },
  { name: 'Starter', price: '$9.99', credits: '200', renewal: 'Renews monthly', fit: 'Occasional family or teacher use', featured: false },
  { name: 'Standard', price: '$19.99', credits: '500', renewal: 'Renews monthly', fit: 'Frequent household / homeschool', featured: true },
  { name: 'Premium', price: '$39.99', credits: '1,500', renewal: 'Renews monthly', fit: 'High-frequency adult organizers', featured: false },
]

const authStates = [
  ['One account', 'Keep your credits and creations connected to one account.'],
  ['Private by default', 'Linea only requests the details needed to identify your account.'],
  ['Easy return', 'If sign-in is cancelled, you can safely return and try again.'],
  ['Help available', 'Contact support if you have trouble accessing your account.'],
]

function PageHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="subpage-header">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <span>{text}</span>
    </section>
  )
}

export function ToolPage({ mode }: { mode: 'photo' | 'text' }) {
  const [rightsChecked, setRightsChecked] = useState(false)
  const [fileName, setFileName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [notice, setNotice] = useState('')
  const isPhoto = mode === 'photo'

  const title = isPhoto ? 'Photo to Coloring Page' : 'Text to Coloring Page'
  const description = isPhoto
    ? 'Prepare one standard coloring page from a photo you own or are authorized to use.'
    : 'Prepare one standard coloring page from an original adult-written theme.'

  return (
    <ProductLayout>
      <PageHeader
        eyebrow={isPhoto ? 'Photo coloring tool' : 'Text coloring tool'}
        title={title}
        text={description}
      />

      <section className="tool-workspace-grid">
        <article className="tool-form-card">
          <div className="form-step">
            <span>1</span>
            <div>
              <h2>{isPhoto ? 'Choose a local photo' : 'Write an original theme'}</h2>
              <p>{isPhoto ? 'The selected file stays in this browser session only.' : 'Do not enter student names, sensitive data, or protected characters.'}</p>
            </div>
          </div>

          {isPhoto ? (
            <label className="upload-zone">
              <UploadCloud size={30} />
              <strong>{fileName || 'Choose a photo'}</strong>
              <span>Your selection stays in this browser until you continue.</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
              />
            </label>
          ) : (
            <label className="prompt-box">
              <Type size={22} />
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Example: A cozy garden activity page with flowers, watering cans, and butterflies"
                rows={6}
              />
            </label>
          )}

          <div className="form-step">
            <span>2</span>
            <div>
              <h2>Confirm you can use this input</h2>
              <p>Please confirm before continuing.</p>
            </div>
          </div>

          <label className="rights-check">
            <input type="checkbox" checked={rightsChecked} onChange={(event) => setRightsChecked(event.target.checked)} />
            <span>
              I confirm I am an adult and have the right to use this input. I am not submitting student PII,
              sensitive data, unauthorized images, protected characters, or public figures.
            </span>
          </label>

          <div className="form-step">
            <span>3</span>
            <div>
              <h2>Review your request</h2>
              <p>One completed coloring page uses one credit.</p>
            </div>
          </div>

          <button
            className="generate-button"
            disabled={!rightsChecked || (isPhoto ? !fileName : prompt.trim().length < 8)}
            onClick={() => setNotice('Your input is ready. Generation is temporarily unavailable.')}
          >
            Review input
            <ArrowRight size={18} />
          </button>
          {notice ? <p className="prototype-alert"><CircleAlert size={16} /> {notice}</p> : null}
        </article>

        <aside className="tool-side-stack">
          <ComparisonCard />
          <article className="mini-ledger-card">
            <div><ScanLine size={18} /> Credit guide</div>
            <p><span>Start a request</span><strong>1 credit held</strong></p>
            <p><span>Page completed</span><strong>1 credit used</strong></p>
            <p><span>Request fails</span><strong>credit returned</strong></p>
          </article>
        </aside>
      </section>
    </ProductLayout>
  )
}

export function PricingPage() {
  return (
    <ProductLayout>
      <PageHeader
        eyebrow="Pricing"
        title="Choose the monthly plan that fits you."
        text="Each credit creates one standard coloring page. Paid plans are coming soon."
      />

      <section className="pricing-grid full-pricing">
        {planRows.map((plan) => (
          <article className={plan.featured ? 'price-card featured' : 'price-card'} key={plan.name}>
            {plan.featured ? <span className="popular-badge">Popular · only one</span> : null}
            <div className="plan-heading"><h3>{plan.name}</h3><span>monthly plan</span></div>
            <div className="plan-price"><strong>{plan.price}</strong><span>USD / month</span></div>
            <p><b>{plan.credits}</b> monthly coloring credits</p>
            <p className="plan-fit">{plan.fit}</p>
            <ul>
              <li><Check size={15} /> {plan.renewal}</li>
              <li><Check size={15} /> Credits are returned when a request fails</li>
              <li><Check size={15} /> Credits refresh each monthly cycle</li>
            </ul>
            <button disabled>Coming soon</button>
          </article>
        ))}
      </section>

      <section className="comparison-table-card">
        <div className="table-heading">
          <CreditCard size={21} />
          <h2>Plan details</h2>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr><th>Feature</th><th>What it means</th><th>Availability</th></tr>
            </thead>
            <tbody>
              <tr><td>One credit</td><td>One completed standard coloring page</td><td>Included</td></tr>
              <tr><td>Text and photo tools</td><td>Both tools use the same credit balance</td><td>Included</td></tr>
              <tr><td>Failed request</td><td>The held credit is returned to your balance</td><td>Included</td></tr>
              <tr><td>Monthly renewal</td><td>Your credits refresh with each paid cycle</td><td>Paid plans</td></tr>
              <tr><td>Checkout</td><td>Secure online payment</td><td>Coming soon</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="checkout-preview-strip">
        <div>
          <h2>Already returned from checkout?</h2>
          <p>Review the latest status of your payment and subscription.</p>
        </div>
        <Link href="/checkout/pending">View payment state pages <ArrowRight size={17} /></Link>
      </section>
    </ProductLayout>
  )
}

export function LoginPage() {
  const [activeState, setActiveState] = useState(authStates[0])

  return (
    <ProductLayout>
      <section className="login-layout">
        <div className="login-copy">
          <p className="hero-kicker">Your Linea account</p>
          <h1>Sign in to manage your credits and creations.</h1>
          <p>
            Linea uses your sign-in only to identify your account. We do not request access to your photos,
            files, email, or contacts.
          </p>
          <div className="login-state-list">
            {authStates.map((state) => (
              <button className={state[0] === activeState[0] ? 'active' : ''} key={state[0]} onClick={() => setActiveState(state)}>
                <code>{state[0]}</code>
                <span>{state[1]}</span>
              </button>
            ))}
          </div>
        </div>

        <article className="login-card">
          <div className="login-card-icon"><LogIn size={24} /></div>
          <h2>Continue with Google</h2>
          <p>Google sign-in is temporarily unavailable. Please check back soon.</p>
          <button className="google-button" disabled>
            <span>G</span>
            Google sign-in unavailable
          </button>
          <div className="selected-auth-state">
            <code>{activeState[0]}</code>
            <p>{activeState[1]}</p>
          </div>
        </article>
      </section>
    </ProductLayout>
  )
}
