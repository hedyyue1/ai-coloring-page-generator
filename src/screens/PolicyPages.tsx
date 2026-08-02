import Link from 'next/link'
import { ArrowRight, CircleAlert, Mail, ShieldCheck } from 'lucide-react'
import ProductLayout from '../components/ProductLayout'

type PolicyType = 'privacy' | 'terms' | 'acceptable-use' | 'refunds' | 'support'

type PolicySection = {
  heading: string
  body: string
}

const policies: Record<PolicyType, { eyebrow: string; title: string; intro: string; sections: PolicySection[] }> = {
  privacy: {
    eyebrow: 'Privacy policy · draft pending review',
    title: 'Minimum data for account, credits, and support.',
    intro: 'This page explains the intended P0 privacy boundary. Retention, deletion, analytics consent, and provider configuration still require legal and technical approval.',
    sections: [
      { heading: 'Identity data', body: 'The service stores an internal user ID and verified Google subject. Email and profile fields are limited to what is necessary for account access and support. The product does not request Google Photos, Drive, Gmail, or contacts.' },
      { heading: 'User content', body: 'Photos, text prompts, jobs, and results are separated from identity and payment records. The default product position is not to use user content for advertising, public galleries, cross-service profiles, or model training without explicit approval and consent.' },
      { heading: 'Payment data', body: 'The site does not store card numbers or CVV. Creem-related records are limited to external IDs, plan snapshots, amount, currency, status, and audit references needed for subscription and ledger consistency.' },
      { heading: 'Deletion', body: 'Deletion must distinguish identity, user content, payment records, logs, backups, and third-party provider records. Exact retention windows remain pending and must be disclosed before launch.' },
    ],
  },
  terms: {
    eyebrow: 'Terms of service · draft pending review',
    title: 'A narrow activity-page workflow with explicit plan rules.',
    intro: 'These draft terms describe the intended P0 service scope. They do not create live payment, refund, commercial-use, or service-level commitments.',
    sections: [
      { heading: 'Service scope', body: 'The service helps adults prepare one standard coloring activity page from an authorized photo or original text. P0 does not include batch generation, books, teams, commercial licensing, 4K output, or an editor.' },
      { heading: 'Accounts and credits', body: 'Credits are attached to an internal account. One credit represents one successfully delivered standard page. Failed jobs release the reservation. Credits are not transferable, redeemable for cash, or combined across accounts.' },
      { heading: 'Subscriptions', body: 'Paid plans are monthly auto-renewal proposals. Checkout, taxes, regions, cancellation, upgrade/downgrade, refund, and dispute behavior must match approved production configuration before purchase opens.' },
      { heading: 'Availability', body: 'The prototype does not promise uninterrupted availability, fixed concurrency, immediate generation, or 24/7 support. Production terms require owner review.' },
    ],
  },
  'acceptable-use': {
    eyebrow: 'Acceptable use policy · draft pending review',
    title: 'Authorized adult input only.',
    intro: 'The product is designed for adults preparing household, homeschool, classroom, or small activity pages without collecting child or student identity data.',
    sections: [
      { heading: 'Allowed input', body: 'Adults may use photos they own or are authorized to use, plus original written themes suitable for a family or general classroom activity.' },
      { heading: 'Prohibited input', body: 'Do not submit student names, photos, rosters, grades, school records, sensitive personal data, unauthorized images, protected characters, public figures, illegal content, or content intended to harass or exploit others.' },
      { heading: 'Product limits', body: 'P0 does not support child accounts, classroom rosters, team seats, bulk generation, book production, API use, or commercial publishing rights.' },
      { heading: 'Enforcement states', body: 'Policy rejection should release a reserved credit and provide a recoverable explanation. Automated review quality and appeal flow require QA before launch.' },
    ],
  },
  refunds: {
    eyebrow: 'Refund and cancellation · draft pending review',
    title: 'Refund states must follow real payment events.',
    intro: 'This page avoids promising guaranteed refunds, no-questions refunds, all-sales-final language, or cancellation behavior that has not been configured and tested.',
    sections: [
      { heading: 'Cancellation', body: 'Cancellation entry, effective date, period-end behavior, grace period, and access after cancellation depend on approved Creem configuration and owner policy.' },
      { heading: 'Refund review', body: 'Undelivered purchases, duplicate charges, and applicable legal rights should enter a real support channel. Eligibility, timing, full or partial refunds, and used-credit treatment remain pending.' },
      { heading: 'Disputes', body: 'Disputes open an entitlement review. Credits or access may be revoked or restored only from trusted payment events and approved policy.' },
      { heading: 'Ledger treatment', body: 'Refunds and disputes use reverse ledger events rather than silently overwriting balance or deleting payment history.' },
    ],
  },
  support: {
    eyebrow: 'Support and complaints · prototype',
    title: 'Support categories without exposing private account data.',
    intro: 'The production support flow is not connected yet. This page defines the categories and safe information boundary for account, payment, generation, and deletion help.',
    sections: [
      { heading: 'Account and login', body: 'Support should handle sign-in cancellation, failure, account-link attention, disconnect requests, and deletion questions without asking for OAuth codes, tokens, or passwords.' },
      { heading: 'Payment and subscription', body: 'Cases should use internal order or subscription references when available. Users should never be asked to send card numbers, CVV, full webhook payloads, or sensitive payment data.' },
      { heading: 'Generation and results', body: 'Support can investigate failed, rejected, timed-out, or undelivered jobs using job references and error classes rather than storing prompt text or photos in the support case.' },
      { heading: 'Complaints and refunds', body: 'Refund, duplicate charge, cancellation, dispute, and policy complaints require a real intake channel and status tracking before launch.' },
    ],
  },
}

export function PolicyPage({ type }: { type: PolicyType }) {
  const policy = policies[type]

  return (
    <ProductLayout>
      <section className="subpage-header compact">
        <p>{policy.eyebrow}</p>
        <h1>{policy.title}</h1>
        <span>{policy.intro}</span>
      </section>

      <div className="prototype-banner">
        <CircleAlert size={18} />
        Draft frontend content for review. It is reachable and substantive, but not yet legal, payment, or production approval.
      </div>

      <section className="policy-grid">
        {policy.sections.map((section, index) => (
          <article key={section.heading}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </section>

      {type === 'support' ? (
        <section className="support-intake-card">
          <div>
            <Mail size={24} />
            <h2>Support intake prototype</h2>
            <p>Choose a category and use an internal reference where available. The form backend is intentionally not connected.</p>
          </div>
          <form action="#support">
            <label>Category<select disabled><option>Payment / subscription</option></select></label>
            <label>Reference<input disabled placeholder="order_... / job_... / subscription_..." /></label>
            <label>Message<textarea disabled rows={5} placeholder="Support backend pending approval" /></label>
            <button disabled>Submit unavailable</button>
          </form>
        </section>
      ) : null}
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
