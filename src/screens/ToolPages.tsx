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

import { operationError, userFacingError, UserFacingError } from '../lib/client-api'
import ComparisonCard from '../components/ComparisonCard'

const planRows = [
  { id: null, name: 'Free', price: '$0', credits: '20', renewal: 'No paid renewal', fit: 'For adults trying the service', featured: false },
  { id: 'starter_monthly', name: 'Starter', price: '$9.99', credits: '200', renewal: 'Monthly auto-renewal', fit: 'Occasional family or teacher use', featured: false },
  { id: 'standard_monthly', name: 'Standard', price: '$19.99', credits: '500', renewal: 'Monthly auto-renewal', fit: 'Frequent household / homeschool', featured: true },
  { id: 'premium_monthly', name: 'Premium', price: '$39.99', credits: '1,500', renewal: 'Monthly auto-renewal', fit: 'High-frequency adult organizers', featured: false },
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
      element.onerror = () => reject(new UserFacingError('image_unreadable', 'photo'))
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
    if (!sourceContext) throw new UserFacingError('browser_processing_unavailable', 'photo')
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
    if (!outputContext) throw new UserFacingError('browser_output_unavailable', 'photo')
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
    ? 'Choose a photo you own or have permission to use and create a black-and-white preview. PNG downloads require Google sign-in and an eligible paid subscription. New purchases are currently unavailable.'
    : 'Text generation is not available right now. Try the photo preview instead.'

  async function handlePhotoGeneration() {
    if (!photoFile || !rightsChecked) return
    setGenerationError('')
    setIsGenerating(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 0))
      const imageData = await generatePhotoLineArt(photoFile)
      const stored = await fetch('/api/results/preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image_data: imageData }) })
      if (!stored.ok) throw new UserFacingError('preview_save_failed', 'photo')
      const result = await stored.json() as { preview_id?: string }
      if (!result.preview_id) throw new UserFacingError('preview_response_missing', 'photo')
      setGeneratedImage(imageData)
      setPreviewId(result.preview_id)
    } catch (error) {
      setGenerationError(operationError(error, 'photo'))
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
        const result = await response.json() as { error?: { code?: string } }
        throw new UserFacingError(result.error?.code || 'download_failed', 'download')
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
      setDownloadError(operationError(error, 'download'))
      setDownloadState('error')
    }
  }

  return (
    <ProductLayout>
      <PageHeader
        eyebrow={isPhoto ? 'Photo preview' : 'Text themes'}
        title={title}
        text={description}
      />

      <section className="tool-workspace-grid">
        <article className="tool-form-card">
          <div className="form-step">
            <span>1</span>
            <div>
              <h2>{isPhoto ? 'Choose a local photo' : 'Write an original theme'}</h2>
              <p>{isPhoto ? 'Your original photo stays in your browser. A copy of the generated coloring-page PNG is sent to our server for download access checks.' : 'Text generation is not available right now. Do not enter student names, sensitive information or protected characters.'}</p>
            </div>
          </div>

          {isPhoto ? (
            <label className="upload-zone">
              <UploadCloud size={30} />
              <strong>{photoFile?.name || 'Choose a PNG, JPG, or WebP photo'}</strong>
              <span>Your original photo stays in your browser. A copy of the generated PNG is sent to our server and may contain recognizable details. Read Privacy before continuing.</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setPhotoFile(file)
                  setGeneratedImage('')
                  setPreviewId('')
                  setDownloadError('')
                  setDownloadState('idle')
                  setGenerationError('')
                }}
              />
            </label>
          ) : (
            <label className="prompt-box">
              <Type size={22} />
              <textarea
                aria-label="Original theme (text generation unavailable)"
                disabled
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
              <h2>Confirm permission to use your content</h2>
              <p>Confirm below before continuing.</p>
            </div>
          </div>

          <label className="rights-check">
            <input type="checkbox" checked={rightsChecked} onChange={(event) => setRightsChecked(event.target.checked)} />
            <span>
              I am an adult and own this content or have permission to use it. It does not include student names or photos,
              sensitive information, unauthorized images, protected characters or public figures.
            </span>
          </label>

          <div className="form-step">
            <span>3</span>
            <div>
              <h2>{isPhoto ? 'Create a photo preview' : 'Text generation unavailable'}</h2>
              <p>{isPhoto ? 'Create a black-and-white preview on your device. Downloading requires Google sign-in and an eligible paid subscription; new purchases are unavailable. A copy of the generated PNG is sent to our server. This preview does not use credits.' : 'Text generation is not available right now. Try the photo preview instead.'}</p>
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
            <Link className="generate-button" href="/photo-to-coloring-page">Try the photo preview <ArrowRight size={18} /></Link>
          )}
          {isPhoto ? <p><Link href="/privacy">Read Privacy</Link> before creating a preview.</p> : null}
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
              <p className="download-gate-note">Your preview is ready. PNG downloads require Google sign-in and an eligible paid subscription. New purchases are currently unavailable; do not pay to unlock a download. Download access lasts 24 hours; this does not mean every stored copy is deleted after 24 hours.</p>
              {downloadError ? <p className="prototype-alert" role="alert"><CircleAlert size={16} /> {downloadError} <Link href="/support">Contact support</Link></p> : null}
            </article>
          ) : <ComparisonCard />}
          <article className="mini-ledger-card">
            <div><ScanLine size={18} /> {isPhoto ? 'Local processing' : 'Generation status'}</div>
            {isPhoto ? <>
              <p><span>Original photo processing</span><span>In your browser</span></p>
              <p><span>Original photo uploaded</span><span>No</span></p>
              <p><span>Generated PNG copy</span><span>Sent to our server when you create a preview</span></p>
              <p><span>Credits used by this preview</span><span>None</span></p>
            </> : <p><span>Text generation</span><span>Not available right now</span></p>}
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
        eyebrow="Monthly plans"
        title="Compare monthly credit allowances"
        text="New purchases are currently unavailable. These monthly plans are shown for information only; no purchase can be made here."
      />

      <section className="pricing-grid full-pricing">
        {planRows.map((plan) => (
          <article className={plan.featured ? 'price-card featured' : 'price-card'} key={plan.name}>
            {plan.featured ? <span className="popular-badge">Recommended</span> : null}
            <div className="plan-heading"><h3>{plan.name}</h3><span>monthly</span></div>
            <div className="plan-price"><strong>{plan.price}</strong><span>USD / month</span></div>
            <p><b>{plan.credits}</b> monthly coloring credits</p>
            <p className="plan-fit">{plan.fit}</p>
            <ul>
              <li><Check size={15} /> {plan.renewal}{plan.id ? '; new purchases unavailable' : ''}</li>
              <li><Check size={15} /> Failed generation does not use a credit</li>
              <li><Check size={15} /> Unused credits expire at the end of the period and do not carry over</li>
            </ul>
            {plan.id ? (
              <button
                className={plan.featured ? 'plan-cta primary' : 'plan-cta'}
                disabled
              >
                Purchases unavailable
              </button>
            ) : <Link className="plan-cta" href="/account">View your account</Link>}
          </article>
        ))}
      </section>


      <section className="comparison-table-card">
        <div className="table-heading"><CreditCard size={21} /><h2>How monthly credits work</h2></div>
        <div className="responsive-table">
          <table>
            <thead><tr><th>Topic</th><th>What it means</th><th>Availability</th></tr></thead>
            <tbody>
              <tr><td>1 credit</td><td>One successfully delivered standard coloring activity page uses one credit. Photo and text generation share one allowance.</td><td>The current photo preview does not use credits. Text generation is unavailable.</td></tr>
              <tr><td>Failed generation</td><td>Failed generation does not use a credit; any credit held for the attempt is returned.</td><td>The current photo preview does not use credits.</td></tr>
              <tr><td>Renewal</td><td>New monthly credits appear only after renewal payment is confirmed. Unused credits expire at the end of the period and do not carry over.</td><td>After payment is confirmed</td></tr>
              <tr><td>Purchases</td><td>Check the final price, taxes, billing frequency and renewal terms before any future purchase.</td><td>New purchases are currently unavailable</td></tr>
              <tr><td>Cancellation</td><td>Review renewal dates and cancellation details before any future purchase. Check Account for existing subscription information or contact Support.</td><td><Link href="/account">Account</Link> · <Link href="/support">Support</Link> · <Link href="/refunds">Refund policy</Link></td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </ProductLayout>
  )
}

export function LoginPage() {
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

  const errorMessage = errorCode ? userFacingError(errorCode, 'login') : ''

  return (
    <ProductLayout>
      <section className="login-layout">
        <article className="login-card">
          <div className="login-card-icon"><LogIn size={24} /></div>
          <h1>Continue with Google</h1>
          <p>We use your Google account identifier, email address and basic profile information to recognize your account. We do not get access to your Google Photos, Drive, Gmail or contacts. Signing in does not confirm your age or permission to use a photo.</p>
          <a className="google-button" href="/api/auth/google/start?returnTo=%2Faccount">
            <span>G</span> Continue with Google
          </a>
          {errorMessage ? <p className="prototype-alert"><CircleAlert size={16} /> {errorMessage}</p> : null}

        </article>
      </section>
    </ProductLayout>
  )
}
