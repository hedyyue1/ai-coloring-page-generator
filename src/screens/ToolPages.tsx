'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  HelpCircle,
  Download,
  Layers,
  LogIn,
  Palette,
  ScanLine,
  ShieldCheck,
  Sparkles,
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

const pricingFaqs = [
  [
    'What is one coloring credit?',
    'One credit is used only when a standard coloring page is successfully created — from either a photo you may use or your own original idea. One completed page, one credit.',
  ],
  [
    'Do the photo and text tools share the same balance?',
    'Yes. Both tools draw from a single monthly credit balance, so you never have to split or convert credits between them.',
  ],
  [
    'What happens if a generation fails?',
    'If a request fails, is rejected, or times out, the reserved credit is released back to your balance. You only spend a credit on a completed page.',
  ],
  [
    'Do unused credits roll over to the next month?',
    'No. Credits refresh at the start of each monthly cycle, and unused credits from the previous cycle expire when that cycle ends.',
  ],
  [
    'How does monthly renewal work?',
    'Paid plans renew monthly after a confirmed payment. New-cycle credits are granted only once the payment is confirmed — returning from checkout shows a pending state until then.',
  ],
  [
    'How do I cancel or request a refund?',
    'You can manage your subscription from your account page. Refund requests are reviewed through our support channel under the published Refund Policy.',
  ],
  [
    'Why do I need to sign in?',
    'Your credits are tied to your account so your balance, cycle, and credit history stay accurate and auditable. Sign-in is used only to identify your account.',
  ],
]

const authStates = [
  ['One account', 'Keep your credits and creations connected to one account.'],
  ['Private by default', 'Linea only requests the details needed to identify your account.'],
  ['Easy return', 'If sign-in is cancelled, you can safely return and try again.'],
  ['Help available', 'Contact support if you have trouble accessing your account.'],
]

const styleOptions = [
  { id: 'standard', label: 'Standard', text: 'Balanced outlines for all skill levels' },
  { id: 'simple', label: 'Simple', text: 'Fewer, bolder lines — relaxed coloring' },
  { id: 'detailed', label: 'Detailed', text: 'Fine lines for experienced colorists' },
]

const promptIdeas = [
  'A cozy garden with flowers, watering cans, and butterflies',
  'A seaside picnic with a lighthouse in the distance',
  'A birthday party with balloons, cake, and presents',
  'A woodland walk with deer, mushrooms, and tall trees',
]

const toolBenefits = [
  { icon: Palette, title: 'Clean outlines', text: 'Clear, well-balanced lines that are a pleasure to color at any skill level.' },
  { icon: Layers, title: 'Style choices', text: 'Pick the line weight and detail level that fits your page.' },
  { icon: Download, title: 'Print-ready', text: 'High-resolution PNG output, ready for home or classroom printing.' },
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
  const [styleId, setStyleId] = useState(styleOptions[0].id)
  const [notice, setNotice] = useState('')
  const isPhoto = mode === 'photo'

  const title = isPhoto ? 'Photo to Coloring Page' : 'Text to Coloring Page'
  const description = isPhoto
    ? 'Upload a photo you own or are authorized to use and preview it as clean, printable line art.'
    : 'Describe an original theme in your own words and turn it into a one-of-a-kind coloring page.'

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
              <h2>{isPhoto ? 'Upload your photo' : 'Write an original theme'}</h2>
              <p>{isPhoto ? 'Supported formats: PNG, JPEG, JPG. The selected file stays in this browser session only.' : 'Do not enter student names, sensitive data, or protected characters.'}</p>
            </div>
          </div>

          {isPhoto ? (
            <label className="upload-zone">
              <UploadCloud size={34} />
              <strong>{fileName || 'Drag your photo here or choose a file'}</strong>
              <span>PNG, JPEG or JPG · your selection stays in this browser until you continue</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
              />
            </label>
          ) : (
            <>
              <label className="prompt-box">
                <Type size={22} />
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: A cozy garden activity page with flowers, watering cans, and butterflies"
                  rows={5}
                />
              </label>
              <div className="prompt-ideas">
                <p>Need an idea? Try one of these:</p>
                <div>
                  {promptIdeas.map((idea) => (
                    <button type="button" key={idea} onClick={() => setPrompt(idea)}>{idea}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="form-step">
            <span>2</span>
            <div>
              <h2>Choose a line-art style</h2>
              <p>Pick the look that fits your coloring page.</p>
            </div>
          </div>

          <div className="style-picker" role="radiogroup" aria-label="Line art style">
            {styleOptions.map((style) => (
              <button
                type="button"
                key={style.id}
                role="radio"
                aria-checked={style.id === styleId}
                className={style.id === styleId ? 'style-option active' : 'style-option'}
                onClick={() => setStyleId(style.id)}
              >
                <strong>{style.label}</strong>
                <span>{style.text}</span>
              </button>
            ))}
          </div>

          <div className="form-step">
            <span>3</span>
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
            <span>4</span>
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
          <ComparisonCard
            colorSrc={isPhoto ? '/examples/cottage-color.jpg' : '/examples/camp-color.jpg'}
            lineSrc={isPhoto ? '/examples/cottage-line.jpg' : '/examples/camp-line.jpg'}
          />
          <article className="mini-ledger-card">
            <div><ScanLine size={18} /> Credit guide</div>
            <p><span>Start a request</span><strong>1 credit held</strong></p>
            <p><span>Page completed</span><strong>1 credit used</strong></p>
            <p><span>Request fails</span><strong>credit returned</strong></p>
          </article>
        </aside>
      </section>

      <section className="panel-section">
        <div className="tool-benefits-grid">
          {toolBenefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <article key={benefit.title}>
                <Icon size={22} />
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="panel-section tool-example-section">
        <div className="feature-split">
          <div className="feature-copy">
            <div className="feature-icon photo"><ShieldCheck size={22} /></div>
            <h2>What you can expect</h2>
            <p>
              These original illustrations show the kind of before-and-line-art comparison you can expect
              from a completed page. They are examples, not generated customer results.
            </p>
            <ul>
              <li><Check size={16} /> Preview in your browser before using credits</li>
              <li><Check size={16} /> Downloads require Google sign-in and an eligible subscription</li>
              <li><Check size={16} /> Download access expires 24 hours after creation</li>
            </ul>
            <Link href="/pricing" className="secondary-button">Compare plans <ArrowRight size={17} /></Link>
          </div>
          <figure className="feature-pair">
            <div className="pair-item">
              <Image src="/examples/cottage-color.jpg" alt="Colorful illustration of a garden cottage" width={640} height={427} sizes="(max-width: 900px) 100vw, 23vw" />
              <span>Photo</span>
            </div>
            <ArrowRight className="pair-arrow" size={26} />
            <div className="pair-item">
              <Image src="/examples/cottage-line.jpg" alt="The cottage illustration converted into printable line art" width={640} height={427} sizes="(max-width: 900px) 100vw, 23vw" />
              <span>Line art</span>
            </div>
          </figure>
        </div>
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
            <button disabled>Subscribe</button>
          </article>
        ))}
      </section>

      <section className="pricing-faq">
        <div className="table-heading">
          <HelpCircle size={21} />
          <h2>Pricing FAQ</h2>
        </div>
        <div className="faq-list">
          {pricingFaqs.map(([question, answer], index) => (
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

      <section className="checkout-preview-strip">
        <div>
          <h2>Ready to create?</h2>
          <p>Turn a photo you may use — or your own original idea — into a printable coloring page.</p>
        </div>
        <div className="strip-actions">
          <Link href="/photo-to-coloring-page"><Sparkles size={16} /> Start with a photo</Link>
          <Link href="/text-to-coloring-page" className="plain">Describe an idea <ArrowRight size={16} /></Link>
        </div>
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
