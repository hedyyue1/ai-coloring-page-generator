'use client'

import { useRef, useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { supportCategories, supportError, supportMessages, supportTicket, validateSupport, type SupportFields } from '../lib/support-form'

export default function SupportForm() {
  const [fields, setFields] = useState<SupportFields>({ category: '', email: '', reference: '', message: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof SupportFields, string>>>({})
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null)
  const sending = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const change = (key: keyof SupportFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setResult(null)
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current) return
    const invalid = validateSupport(fields)
    setErrors(invalid)
    if (Object.keys(invalid).length) {
      formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(invalid)[0]}"]`)?.focus()
      return
    }
    sending.current = true
    setPending(true)
    setResult(null)
    try {
      const response = await fetch('/api/support', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: fields.category, email: fields.email.trim().toLowerCase(), reference: fields.reference.trim(), message: fields.message.trim() }),
      })
      const payload: unknown = await response.json().catch(() => null)
      const ticket = supportTicket(response.status, payload)
      setResult(ticket
        ? { success: true, text: `Your request has been received. Your reference is ${ticket}. Keep it in case you contact us again.` }
        : { success: false, text: supportError(response.status) })
    } catch {
      setResult({ success: false, text: supportMessages.unknown })
    } finally {
      sending.current = false
      setPending(false)
    }
  }
  const feedback = (key: keyof SupportFields) => errors[key] ? <span id={`support-${key}-error`} className="support-field-error">{errors[key]}</span> : null
  return (
    <section className="support-intake-card" aria-labelledby="support-form-heading">
      <div>
        <Mail size={24} aria-hidden="true" />
        <h2 id="support-form-heading">Send a support request</h2>
        <p>Please fill in the fields below. Use an email address where you can receive a reply. Your message and contact details will be stored with the request so the issue can be reviewed. See our <a href="/privacy">Privacy policy</a>.</p>
        <p>Do not send passwords, sign-in codes, card numbers, card security codes, private photos, student information or identity documents. The form does not accept attachments.</p>
        <p>Email <a href="mailto:support@coloringpageflow.com">support@coloringpageflow.com</a> if you prefer.</p>
      </div>
      <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending}>
        <label htmlFor="support-category">What do you need help with?
          <select id="support-category" name="category" value={fields.category} onChange={(event) => change('category', event.target.value)} required disabled={pending} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? 'support-category-error' : undefined}>
            <option value="">Choose a topic</option>
            {supportCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>{feedback('category')}
        </label>
        <label htmlFor="support-email">Your email address
          <input id="support-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} value={fields.email} onChange={(event) => change('email', event.target.value)} required disabled={pending} aria-invalid={Boolean(errors.email)} aria-describedby={`support-email-help${errors.email ? ' support-email-error' : ''}`} />
          <span id="support-email-help">Use the email for your Linea account if the issue concerns your account or payment.</span>{feedback('email')}
        </label>
        <label htmlFor="support-reference">Order, subscription or result reference (optional)
          <input id="support-reference" name="reference" maxLength={128} value={fields.reference} onChange={(event) => change('reference', event.target.value)} disabled={pending} aria-invalid={Boolean(errors.reference)} aria-describedby={`support-reference-help${errors.reference ? ' support-reference-error' : ''}`} />
          <span id="support-reference-help">Paste a reference if you have one. Leave this blank if you do not. Do not paste a full link.</span>{feedback('reference')}
        </label>
        <label htmlFor="support-message">What happened?
          <textarea id="support-message" name="message" rows={6} placeholder="Tell us what you were trying to do, what happened instead and any safe-to-share error message. Please use 10–4,000 characters." value={fields.message} onChange={(event) => change('message', event.target.value)} required disabled={pending} aria-invalid={Boolean(errors.message)} aria-describedby={`support-message-count${errors.message ? ' support-message-error' : ''}`} />
          <span id="support-message-count">{Array.from(fields.message.trim()).length} / 4,000 characters</span>{feedback('message')}
        </label>
        <p>Do not include passwords, sign-in codes, card details, private photos or student information.</p>
        <button type="submit" disabled={pending || result?.success}>{pending ? 'Sending your request…' : 'Send request'}</button>
        <div aria-live="polite" aria-atomic="true">
          {result ? <p className={result.success ? 'support-success' : 'support-field-error'}>{result.text}</p> : null}
        </div>
        <noscript>The support form is currently unavailable. You can email <a href="mailto:support@coloringpageflow.com">support@coloringpageflow.com</a>. Please describe the issue without sending private photos, passwords or payment details.</noscript>
      </form>
    </section>
  )
}
