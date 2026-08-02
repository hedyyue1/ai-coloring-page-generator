'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Image as ImageIcon, LogIn, Sparkles, Type, UploadCloud } from 'lucide-react'
import ProductLayout from '@/components/ProductLayout'
import PageHeader from '@/components/PageHeader'
import { useSession } from '@/auth/session'

const plans = [
  { name: 'Free', price: '$0', credits: '20 credits / month', note: 'Try the essentials' },
  { name: 'Starter', price: '$5', credits: '100 credits / month', note: 'For occasional projects' },
  { name: 'Standard', price: '$10', credits: '300 credits / month', note: 'For regular creators', recommended: true },
  { name: 'Pro', price: '$20', credits: '800 credits / month', note: 'For high-volume use' },
]

export function ToolPage({ mode }: { mode: 'photo' | 'text' }) {
  const photo = mode === 'photo'
  const [fileName, setFileName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [rightsChecked, setRightsChecked] = useState(false)
  const [notice, setNotice] = useState('')
  const ready = rightsChecked && (photo ? Boolean(fileName) : prompt.trim().length >= 8)

  return <ProductLayout><div className="page-shell">
    <PageHeader eyebrow={photo ? 'Photo to coloring page' : 'Text to coloring page'} title={photo ? 'Turn a favorite photo into line art.' : 'Describe the page you want to color.'} text={photo ? 'Choose a clear photo and create a clean, printable outline.' : 'Write a simple scene and turn it into a printable coloring page.'} />
    <section className="tool-grid"><article className="tool-card"><div className="tool-card-title">{photo ? <ImageIcon/> : <Type/>}<div><h2>{photo ? 'Choose a photo' : 'Describe your idea'}</h2><p>{photo ? 'JPG, PNG, or WebP works best.' : 'Include the main subject, setting, and mood.'}</p></div></div>
      {photo ? <label className="upload-zone"><UploadCloud size={30}/><strong>{fileName || 'Choose a photo'}</strong><span>Your image stays selected only for this session.</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setFileName(e.target.files?.[0]?.name || '')}/></label> : <label className="prompt-field"><span>Your description</span><textarea rows={8} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="A friendly fox reading under a big oak tree…"/><small>{prompt.length} characters</small></label>}
      <label className="rights-check"><input type="checkbox" checked={rightsChecked} onChange={e=>setRightsChecked(e.target.checked)}/><span>I own this content or have permission to use it.</span></label>
      <button className="generate-button" disabled={!ready} onClick={()=>setNotice('Generation is temporarily unavailable. Please try again soon.')}>Create coloring page <ArrowRight size={18}/></button>
      {notice && <p className="prototype-alert">{notice}</p>}
    </article><aside className="tool-side-stack"><article className="mini-ledger-card"><div><Sparkles size={18}/> Tips for a great result</div><p>Use a clear subject and simple background.</p><p>Choose good lighting and avoid heavy blur.</p><p>Keep text prompts specific but concise.</p></article></aside></section>
  </div></ProductLayout>
}

export function PricingPage() {
  const session = useSession()
  return <ProductLayout><div className="page-shell"><PageHeader eyebrow="Simple pricing" title="Choose the right number of monthly credits." text="One credit creates one standard coloring page. Start free and upgrade when you need more." />
    <section className="pricing-grid page-pricing">{plans.map(plan => <article key={plan.name} className={plan.recommended ? 'featured' : ''}>{plan.recommended && <span className="recommended-label">Most popular</span>}<h3>{plan.name}</h3><div className="price"><strong>{plan.price}</strong><span>/ month</span></div><p>{plan.note}</p><ul><li><Check size={15}/>{plan.credits}</li><li><Check size={15}/>Photo and text creation</li><li><Check size={15}/>Printable downloads</li></ul>{plan.name === 'Free' ? <Link className="primary-button" href={session.status === 'authenticated' ? '/account' : '/login'}>{session.status === 'authenticated' ? 'View account' : 'Get started'}</Link> : <button disabled>Coming soon</button>}</article>)}</section>
  </div></ProductLayout>
}

export function LoginPage() {
  const session = useSession()
  return <ProductLayout><div className="page-shell"><section className="login-layout"><div className="login-copy"><p className="hero-kicker">Welcome to Linea</p><h1>Sign in to save your creations and credits.</h1><p>Your account keeps your plan, credit balance, and activity together across devices.</p></div><article className="login-card"><div className="login-card-icon"><LogIn size={24}/></div><h2>{session.status === 'authenticated' ? `Welcome, ${session.account.user.name}` : 'Continue with Google'}</h2>{session.status === 'authenticated' ? <Link className="primary-button full" href="/account">Open your account <ArrowRight size={17}/></Link> : <><p>Secure sign-in is temporarily unavailable. Please check back soon.</p><button className="google-button" disabled><span>G</span> Continue with Google</button></>}</article></section></div></ProductLayout>
}
