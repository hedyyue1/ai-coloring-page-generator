import Link from 'next/link'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import ProductLayout from '@/components/ProductLayout'
import PageHeader from '@/components/PageHeader'

export type PolicyType = 'privacy' | 'terms' | 'acceptable-use' | 'refunds' | 'support'

const content: Record<PolicyType, { eyebrow: string; title: string; intro: string; sections: { heading: string; body: string }[] }> = {
  privacy: { eyebrow: 'Privacy policy', title: 'Your privacy matters.', intro: 'This policy explains the information Linea uses to provide accounts, coloring tools, credits, and support.', sections: [
    { heading: 'Account information', body: 'We use the minimum profile information needed to provide account access and support. We do not ask for your Google Photos, Drive, Gmail, or contacts.' },
    { heading: 'Your creations', body: 'Photos, descriptions, and generated results are used to provide the service. We do not use your content for public galleries, advertising, or model training without clear permission.' },
    { heading: 'Payments', body: 'Linea does not store full card numbers or security codes. Payment providers process payment details and return the records needed to manage your plan.' },
    { heading: 'Your choices', body: 'You can ask to access or delete your account data. Some billing, fraud-prevention, or legal records may need to be retained for a limited period.' },
  ]},
  terms: { eyebrow: 'Terms of service', title: 'Clear terms for creating with Linea.', intro: 'By using Linea, you agree to use the service responsibly and only submit content you are allowed to use.', sections: [
    { heading: 'Using the service', body: 'Linea helps adults create standard coloring pages from authorized photos and original descriptions.' },
    { heading: 'Accounts and credits', body: 'Credits belong to the account that received or purchased them. One successfully created standard page uses one credit.' },
    { heading: 'Subscriptions', body: 'Paid plans renew monthly unless cancelled. Current price, credits, and renewal details are shown before purchase.' },
    { heading: 'Availability', body: 'We work to keep Linea reliable, but interruptions may occur for maintenance, safety, or technical reasons.' },
  ]},
  'acceptable-use': { eyebrow: 'Acceptable use', title: 'Create safely and respectfully.', intro: 'Use content you own or have permission to use, and protect the privacy and rights of others.', sections: [
    { heading: 'Allowed content', body: 'You may use your own photos, authorized images, and original descriptions suitable for a general audience.' },
    { heading: 'Private information', body: 'Do not upload school records, financial information, passwords, medical records, or other sensitive personal data.' },
    { heading: 'Rights and safety', body: 'Do not submit illegal, exploitative, harassing, deceptive, or unauthorized copyrighted content.' },
    { heading: 'Enforcement', body: 'We may block content or restrict accounts when needed to protect people, rights holders, and the service.' },
  ]},
  refunds: { eyebrow: 'Refunds and cancellations', title: 'Help with a purchase or subscription.', intro: 'Contact support if you see a duplicate charge, an undelivered purchase, or another billing issue.', sections: [
    { heading: 'Cancel a plan', body: 'You may cancel a paid plan from your account before the next renewal. Access continues through the current billing period unless stated otherwise.' },
    { heading: 'Refund requests', body: 'Refund eligibility depends on the purchase, credit usage, local law, and the reason for the request.' },
    { heading: 'Duplicate or incorrect charges', body: 'Contact support with the date and account email. Never send full card details or security codes.' },
  ]},
  support: { eyebrow: 'Support', title: 'How can we help?', intro: 'Choose the area that best matches your question. Never share passwords, sign-in codes, or full payment card details.', sections: [
    { heading: 'Account and sign-in', body: 'Get help accessing your account or understanding your profile and privacy choices.' },
    { heading: 'Creating a page', body: 'Get help with a failed creation, image quality, or downloading a result.' },
    { heading: 'Plans and billing', body: 'Ask about credits, subscriptions, duplicate charges, cancellations, or refunds.' },
  ]},
}

export function PolicyPage({ type }: { type: PolicyType }) {
  const page = content[type]
  return <ProductLayout><div className="page-shell policy-shell"><PageHeader eyebrow={page.eyebrow} title={page.title} text={page.intro}/><section className="policy-grid">{page.sections.map(section => <article key={section.heading}><ShieldCheck size={21}/><h2>{section.heading}</h2><p>{section.body}</p></article>)}</section>{type === 'support' && <section className="support-card"><div><Mail size={24}/><h2>Support contact</h2><p>Support contact details will be available here soon.</p></div></section>}<p className="policy-updated">Last updated: August 2, 2026</p></div></ProductLayout>
}

export function NotFoundPage() { return <ProductLayout><div className="page-shell"><section className="not-found"><p className="hero-kicker">404</p><h1>We couldn’t find that page.</h1><p>The link may be outdated or the page may have moved.</p><Link className="primary-button" href="/"><ArrowLeft size={16}/> Back home</Link></section></div></ProductLayout> }
