'use client'

import { useEffect, useState } from 'react'
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

async function secureCheckout(planId: string) {
  const csrf = await fetch('/api/csrf', { cache: 'no-store' })
  if (!csrf.ok) return csrf
  const payload = await csrf.json() as { data?: { csrf_token?: string } }
  return fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json', 'X-CSRF-Token': payload.data?.csrf_token || '', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ plan_id: planId }) })
}
import ComparisonCard from '../components/ComparisonCard'

const planRows = [
  { id: null, name: 'Free', price: '$0', credits: '20', renewal: 'No paid renewal', fit: 'Controlled first experience', featured: false },
  { id: 'starter_monthly', name: 'Starter', price: '$9.99', credits: '200', renewal: 'Monthly auto-renewal', fit: 'Occasional family or teacher use', featured: false },
  { id: 'standard_monthly', name: 'Standard', price: '$19.99', credits: '500', renewal: 'Monthly auto-renewal', fit: 'Frequent household / homeschool', featured: true },
  { id: 'premium_monthly', name: 'Premium', price: '$39.99', credits: '1,500', renewal: 'Monthly auto-renewal', fit: 'High-frequency adult organizers', featured: false },
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

async function generatePhotoLineArt(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('The selected image could not be read. Please choose a PNG, JPG, or WebP image.'))
      element.src = objectUrl
    })
    const longestSide = 1440
    const scale = Math.min(1, longestSide / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = width
    sourceCanvas.height = height
    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })
    if (!sourceContext) throw new Error('Your browser does not support image processing.')
    sourceContext.drawImage(image, 0, 0, width, height)

    const source = sourceContext.getImageData(0, 0, width, height)
    const grayscale = new Uint8ClampedArray(width * height)
    for (let index = 0; index < grayscale.length; index += 1) {
      const pixel = index * 4
      grayscale[index] = Math.round(source.data[pixel] * 0.299 + source.data[pixel + 1] * 0.587 + source.data[pixel + 2] * 0.114)
    }

    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = width
    outputCanvas.height = height
    const outputContext = outputCanvas.getContext('2d')
    if (!outputContext) throw new Error('Your browser does not support coloring-page output.')
    const output = outputContext.createImageData(width, height)
    for (let pixel = 0; pixel < output.data.length; pixel += 4) {
      output.data[pixel] = 255
      output.data[pixel + 1] = 255
      output.data[pixel + 2] = 255
      output.data[pixel + 3] = 255
    }
    const outlineThreshold = 38
    const edgeMap = new Uint8Array(width * height)
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const center = y * width + x
        const gx = -grayscale[center - width - 1] - 2 * grayscale[center - 1] - grayscale[center + width - 1]
          + grayscale[center - width + 1] + 2 * grayscale[center + 1] + grayscale[center + width + 1]
        const gy = -grayscale[center - width - 1] - 2 * grayscale[center - width] - grayscale[center - width + 1]
          + grayscale[center + width - 1] + 2 * grayscale[center + width] + grayscale[center + width + 1]
        const isOutline = Math.hypot(gx, gy) > outlineThreshold || grayscale[center] < 72
        edgeMap[center] = isOutline ? 1 : 0
        const pixel = center * 4
        const value = isOutline ? 12 : 255
        output.data[pixel] = value
        output.data[pixel + 1] = value
        output.data[pixel + 2] = value
        output.data[pixel + 3] = 255
      }
    }
    // Thicken connected contour pixels so the result remains printable at page scale.
    const dilatedOutline = new Uint8Array(width * height)
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const center = y * width + x
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            if (edgeMap[(y + offsetY) * width + x + offsetX]) dilatedOutline[center] = 1
          }
        }
        if (dilatedOutline[center]) {
          const pixel = center * 4
          output.data[pixel] = 0
          output.data[pixel + 1] = 0
          output.data[pixel + 2] = 0
        }
      }
    }
    outputContext.putImageData(output, 0, 0)
    return outputCanvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function ToolPage({ mode }: { mode: 'photo' | 'text' }) {
  const [rightsChecked, setRightsChecked] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState('')
  const [previewId, setPreviewId] = useState('')
  const [generationError, setGenerationError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadState, setDownloadState] = useState<'idle' | 'working' | 'error'>('idle')
  const [downloadError, setDownloadError] = useState('')
  const isPhoto = mode === 'photo'

  const title = isPhoto ? 'Photo to Coloring Page' : 'Text to Coloring Page'
  const description = isPhoto
    ? 'Choose a photo you have the right to use, then create a free line-art preview. PNG download requires Google sign-in and an active paid subscription.'
    : 'Prepare one standard coloring page from an original adult-written theme.'

  async function handlePhotoGeneration() {
    if (!photoFile || !rightsChecked) return
    setGenerationError('')
    setIsGenerating(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 0))
      const imageData = await generatePhotoLineArt(photoFile)
      const stored = await fetch('/api/results/preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image_data: imageData }) })
      if (!stored.ok) throw new Error('Unable to save the protected download copy. Your original photo was not uploaded.')
      const result = await stored.json() as { preview_id?: string }
      if (!result.preview_id) throw new Error('Unable to prepare this preview for protected download.')
      setGeneratedImage(imageData)
      setPreviewId(result.preview_id)
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Unable to create a coloring page from this image.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function requestProtectedDownload() {
    if (!previewId || downloadState === 'working') return
    setDownloadState('working')
    setDownloadError('')
    try {
      const response = await fetch('/api/results/download', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ preview_id: previewId }),
      })
      if (response.status === 401) {
        window.location.assign(`/api/auth/google/start?returnTo=${encodeURIComponent('/photo-to-coloring-page')}`)
        return
      }
      if (!response.ok) {
        const result = await response.json() as { error?: { message?: string } }
        throw new Error(result.error?.message || 'Download is unavailable.')
      }
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = 'linea-coloring-page.png'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setDownloadState('idle')
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Download is unavailable.')
      setDownloadState('error')
    }
  }

  return (
    <ProductLayout>
      <PageHeader
        eyebrow={isPhoto ? 'Authorized photo workflow' : 'Original text workflow'}
        title={title}
        text={description}
      />

      <section className="tool-workspace-grid">
        <article className="tool-form-card">
          <div className="form-step">
            <span>1</span>
            <div>
              <h2>{isPhoto ? 'Choose a local photo' : 'Write an original theme'}</h2>
              <p>{isPhoto ? 'Your photo is processed locally in this browser and is not uploaded to our server.' : 'Do not enter student names, sensitive data, or protected characters.'}</p>
            </div>
          </div>

          {isPhoto ? (
            <label className="upload-zone">
              <UploadCloud size={30} />
              <strong>{photoFile?.name || 'Choose a PNG, JPG, or WebP photo'}</strong>
              <span>Local browser processing only — no photo upload or storage.</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setPhotoFile(file)
                  setGeneratedImage('')
                  setGenerationError('')
                }}
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
              <p>Required before creating a local coloring-page result.</p>
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
              <h2>{isPhoto ? 'Generate a coloring page' : 'Text generation setup'}</h2>
              <p>{isPhoto ? 'Creates a free black-and-white line-art preview on this device. PNG download requires Google sign-in and an active paid subscription.' : 'Text-to-image generation needs a configured image provider.'}</p>
            </div>
          </div>

          {isPhoto ? (
            <button
              className="generate-button"
              disabled={!rightsChecked || !photoFile || isGenerating}
              onClick={handlePhotoGeneration}
            >
              {isGenerating ? 'Creating coloring page…' : generatedImage ? 'Create another coloring page' : 'Generate coloring page'}
              <ArrowRight size={18} />
            </button>
          ) : (
            <button className="generate-button" disabled={!rightsChecked || prompt.trim().length < 8} onClick={() => setGenerationError('Text-to-image generation needs a configured image provider before it can run.')}>Request text generation setup <ArrowRight size={18} /></button>
          )}
          {generationError ? <p className="prototype-alert"><CircleAlert size={16} /> {generationError}</p> : null}
        </article>

        <aside className="tool-side-stack">
          {isPhoto && generatedImage ? (
            <article className="generation-result">
              <div><ScanLine size={18} /> Generated coloring page</div>
              {/* The output is a same-session canvas data URL, so Next image optimization cannot fetch it. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={generatedImage} alt="Generated black-and-white coloring page" />
              <button className="primary-button" onClick={requestProtectedDownload} disabled={downloadState === 'working'}>
                {downloadState === 'working' ? 'Checking download access…' : 'Download PNG'} <ArrowRight size={17} />
              </button>
              <p className="download-gate-note">Free preview is available. PNG download requires Google sign-in and an active paid subscription.</p>
              {downloadError ? <p className="prototype-alert"><CircleAlert size={16} /> {downloadError} <Link href="/pricing">View plans</Link></p> : null}
            </article>
          ) : <ComparisonCard />}
          <article className="mini-ledger-card">
            <div><ScanLine size={18} /> {isPhoto ? 'Local processing' : 'Generation status'}</div>
            {isPhoto ? <p><code>photo.processing</code><span>browser only</span></p> : <p><code>image.provider</code><span>not configured</span></p>}
            <p><code>photo.storage</code><span>none</span></p>
            <p><code>credit.balance</code><span>unchanged</span></p>
          </article>
        </aside>
      </section>
    </ProductLayout>
  )
}

export function PricingPage() {
  const [busyPlan, setBusyPlan] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState('')

  async function beginCheckout(planId: string) {
    setBusyPlan(planId)
    setCheckoutError('')
    try {
      const response = await secureCheckout(planId)
      const result = await response.json() as { data?: { checkout_url?: string }; checkout_url?: string; error?: { code?: string; message?: string } }
      if (response.status === 401) {
        window.location.assign(`/api/auth/google/start?returnTo=${encodeURIComponent(`/pricing?plan=${planId}`)}`)
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
      <PageHeader
        eyebrow="Pricing · Waffo Test checkout"
        title="Monthly credits for one standard page at a time."
        text="Paid plans open Waffo hosted checkout in Test Mode. Entitlements appear only after a verified webhook."
      />

      <section className="pricing-grid full-pricing">
        {planRows.map((plan) => (
          <article className={plan.featured ? 'price-card featured' : 'price-card'} key={plan.name}>
            {plan.featured ? <span className="popular-badge">Popular · only one</span> : null}
            <div className="plan-heading"><h3>{plan.name}</h3><span>monthly</span></div>
            <div className="plan-price"><strong>{plan.price}</strong><span>USD / month</span></div>
            <p><b>{plan.credits}</b> monthly coloring credits</p>
            <p className="plan-fit">{plan.fit}</p>
            <ul>
              <li><Check size={15} /> {plan.renewal}</li>
              <li><Check size={15} /> Failed generation releases reservation</li>
              <li><Check size={15} /> Entitlement requires a verified Waffo webhook</li>
            </ul>
            {plan.id ? (
              <button
                className={plan.featured ? 'plan-cta primary' : 'plan-cta'}
                disabled={busyPlan !== null}
                onClick={() => beginCheckout(plan.id!)}
              >
                {busyPlan === plan.id ? 'Opening secure checkout…' : `Choose ${plan.name}`}
              </button>
            ) : <Link className="plan-cta" href="/login">Start free</Link>}
          </article>
        ))}
      </section>
      {checkoutError ? <p className="prototype-alert"><CircleAlert size={16} /> {checkoutError}</p> : null}

      <section className="comparison-table-card">
        <div className="table-heading"><CreditCard size={21} /><h2>Shared plan contract</h2></div>
        <div className="responsive-table">
          <table>
            <thead><tr><th>Contract item</th><th>Production rule</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>1 coloring_credit</td><td>One successfully delivered standard activity page</td><td>Defined</td></tr>
              <tr><td>Failed generation</td><td>Reservation is released, not silently consumed</td><td>Defined</td></tr>
              <tr><td>Renewal</td><td>New credits only after a verified successful webhook</td><td>Requires verified payment</td></tr>
              <tr><td>Checkout</td><td>Server maps fixed SKU, amount, currency, user, and reference</td><td>Waffo Test</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </ProductLayout>
  )
}

export function LoginPage() {
  const activeState = authStates[0]
  const [errorCode, setErrorCode] = useState('')

  useEffect(() => {
    setErrorCode(new URLSearchParams(window.location.search).get('error') || '')
    const controller = new AbortController()
    fetch('/api/me', { credentials: 'include', cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return
        const payload = await response.json() as { user?: { id?: string } | null }
        if (!controller.signal.aborted && payload.user?.id) window.location.replace('/account')
      })
      .catch(() => { /* Keep sign-in available when the session check fails. */ })
    return () => controller.abort()
  }, [])

  const errorMessage = errorCode === 'oauth_not_configured'
    ? 'Google sign-in still needs its production client credentials.'
    : errorCode ? 'Google sign-in did not finish. Please try again.' : ''

  return (
    <ProductLayout>
      <section className="login-layout">
        <article className="login-card">
          <div className="login-card-icon"><LogIn size={24} /></div>
          <h2>Continue with Google</h2>
          <p>We request only OpenID, email, and basic profile scopes. Your session is stored in a secure, HttpOnly cookie.</p>
          <a className="google-button" href="/api/auth/google/start?returnTo=%2Faccount">
            <span>G</span> Continue with Google
          </a>
          {errorMessage ? <p className="prototype-alert"><CircleAlert size={16} /> {errorMessage}</p> : null}
          <div className="selected-auth-state"><code>{activeState[0]}</code><p>{activeState[1]}</p></div>
        </article>
      </section>
    </ProductLayout>
  )
}
