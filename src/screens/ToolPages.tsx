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
  { name: 'Starter', price: '$9.99', credits: '200', renewal: 'Monthly auto-renewal proposal', fit: 'Occasional family or teacher use', featured: false },
  { name: 'Standard', price: '$19.99', credits: '500', renewal: 'Monthly auto-renewal proposal', fit: 'Frequent household / homeschool', featured: true },
  { name: 'Premium', price: '$39.99', credits: '1,500', renewal: 'Monthly auto-renewal proposal', fit: 'High-frequency adult organizers', featured: false },
]

const authStates = [
  ['sign_in_started', 'The user is being sent to Google. No entitlement is created.'],
  ['sign_in_cancelled', 'The user can safely return. No checkout or credits are created.'],
  ['sign_in_failed', 'A generic recovery state avoids token, code, or account enumeration details.'],
  ['account_link_attention', 'A support/recovery state prevents silent email-based account merging.'],
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
        eyebrow={isPhoto ? 'Authorized photo workflow' : 'Original text workflow'}
        title={title}
        text={`${description} This frontend prototype does not upload, store, or generate a real result.`}
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
              <strong>{fileName || 'Choose a photo for the prototype'}</strong>
              <span>No file is uploaded or persisted.</span>
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
              <h2>Confirm the input boundary</h2>
              <p>Required before any real generation job could reserve a credit.</p>
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
              <h2>Preview credit reservation</h2>
              <p>One successful standard page would consume one shared coloring_credit.</p>
            </div>
          </div>

          <button
            className="generate-button"
            disabled={!rightsChecked || (isPhoto ? !fileName : prompt.trim().length < 8)}
            onClick={() => setNotice('Prototype notice: generation, upload, and credit reservation are not connected yet.')}
          >
            Preview generation reservation
            <ArrowRight size={18} />
          </button>
          {notice ? <p className="prototype-alert"><CircleAlert size={16} /> {notice}</p> : null}
        </article>

        <aside className="tool-side-stack">
          <ComparisonCard />
          <article className="mini-ledger-card">
            <div><ScanLine size={18} /> Reservation preview</div>
            <p><code>credit.reserved</code><span>1</span></p>
            <p><code>delivery.success</code><span>consume 1</span></p>
            <p><code>job.failure</code><span>release 1</span></p>
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
        eyebrow="Pricing · V5 proposal · hold"
        title="Monthly credits for one standard page at a time."
        text="Four tiers are shown for review. Checkout remains disabled until cost, tax, region, policy, QA, Creem configuration, and owner approval pass."
      />

      <section className="pricing-grid full-pricing">
        {planRows.map((plan) => (
          <article className={plan.featured ? 'price-card featured' : 'price-card'} key={plan.name}>
            {plan.featured ? <span className="popular-badge">Popular · only one</span> : null}
            <div className="plan-heading"><h3>{plan.name}</h3><span>monthly proposal</span></div>
            <div className="plan-price"><strong>{plan.price}</strong><span>USD / month</span></div>
            <p><b>{plan.credits}</b> monthly coloring credits</p>
            <p className="plan-fit">{plan.fit}</p>
            <ul>
              <li><Check size={15} /> {plan.renewal}</li>
              <li><Check size={15} /> Failed generation releases reservation</li>
              <li><Check size={15} /> Unused cycle credits do not roll over by default</li>
            </ul>
            <button disabled>Purchase closed pending approval</button>
          </article>
        ))}
      </section>

      <section className="comparison-table-card">
        <div className="table-heading">
          <CreditCard size={21} />
          <h2>Shared plan contract</h2>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr><th>Contract item</th><th>P0 design</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr><td>1 coloring_credit</td><td>One successfully delivered standard activity page</td><td>Defined</td></tr>
              <tr><td>Text and photo balance</td><td>One shared balance, no split buckets</td><td>Defined</td></tr>
              <tr><td>Failed generation</td><td>Reservation is released, not silently consumed</td><td>Requires QA</td></tr>
              <tr><td>Renewal</td><td>New credits only after a verified successful webhook</td><td>Requires Creem validation</td></tr>
              <tr><td>Checkout</td><td>Server-created SKU, amount, currency, user, and reference</td><td>Disabled</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="checkout-preview-strip">
        <div>
          <h2>Need to inspect payment states?</h2>
          <p>Return pages do not activate subscriptions. Only verified webhook events can change entitlement.</p>
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
          <p className="hero-kicker">Google OIDC prototype</p>
          <h1>Sign in to attach credits to one account.</h1>
          <p>
            Google sign-in is account identity only. It is not age verification, proof of image rights,
            a security endorsement, or permission to read Photos, Drive, Gmail, or contacts.
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
          <p>OAuth is not connected in this frontend package. The production flow still requires redirect URI, state, nonce, PKCE, session, and account-linking validation.</p>
          <button className="google-button" disabled>
            <span>G</span>
            OAuth pending R6 configuration
          </button>
          <Link className="primary-button full" href="/account">Preview signed-in account <ArrowRight size={17} /></Link>
          <div className="selected-auth-state">
            <code>{activeState[0]}</code>
            <p>{activeState[1]}</p>
          </div>
        </article>
      </section>
    </ProductLayout>
  )
}
