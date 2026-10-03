import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import ProductLayout from '../components/ProductLayout'
import SupportForm from '../components/SupportForm'
import { policies, type PolicyType } from '../lib/policy-copy'
// The source uses a small, trusted Markdown-link subset; render text without HTML.
function PolicyText({ text }: { text: string }) {
  return <>{text.split(/(\[[^\]]+\]\((?:\/[^)\s]*|mailto:support@coloringpageflow.com)\))/g).map((part, index) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    return link ? <a key={index} href={link[2]}>{link[1]}</a> : part
  })}</>
}

export function PolicyPage({ type }: { type: PolicyType }) {
  const policy = policies[type]

  return (
    <ProductLayout>
      <section className="subpage-header compact">
        <p>{policy.eyebrow}</p>
        <h1>{policy.title}</h1>
        <span><PolicyText text={policy.intro} /></span>
      </section>


      <section className="policy-grid">
        {policy.sections.map((section, index) => (
          <article key={section.heading}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}><PolicyText text={paragraph} /></p>)}
          </article>
        ))}
      </section>

      {type === 'support' ? <SupportForm /> : null}
    </ProductLayout>
  )
}

export function NotFoundPage() {
  return (
    <ProductLayout>
      <section className="not-found-page">
        <ShieldCheck size={34} />
        <p className="hero-kicker">404</p>
        <h1>This prototype page does not exist.</h1>
        <p>Private account, checkout, job, upload, API, and result paths must not be indexed or exposed without authentication.</p>
        <Link className="primary-button" href="/">Return home <ArrowRight size={17} /></Link>
      </section>
    </ProductLayout>
  )
}
