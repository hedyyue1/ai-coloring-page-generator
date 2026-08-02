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
    eyebrow: 'Privacy policy',
    title: 'Minimum data for account, credits, and support.',
    intro: 'This page explains what information Linea uses for accounts, credits, creations, payments, and support.',
    sections: [
      { heading: 'Identity data', body: 'Linea uses an account identifier, email address, and limited profile details needed for account access and support. Linea does not request access to Google Photos, Drive, Gmail, or contacts.' },
      { heading: 'User content', body: 'Photos, text prompts, jobs, and results are separated from identity and payment records. The default product position is not to use user content for advertising, public galleries, cross-service profiles, or model training without explicit approval and consent.' },
      { heading: 'Payment data', body: 'Linea does not store card numbers or security codes. Payment records are limited to the details needed to show orders, subscriptions, amounts, currencies, and payment status.' },
      { heading: 'Deletion', body: 'A deletion request may cover your profile and creations. Some payment or security records may be kept when required by law, and exact timing will be shown when requests become available.' },
    ],
  },
  terms: {
    eyebrow: 'Terms of service',
    title: 'A narrow activity-page workflow with explicit plan rules.',
    intro: 'These terms describe the current service scope and the basic rules for accounts, credits, plans, and availability.',
    sections: [
      { heading: 'Service scope', body: 'The service helps adults prepare one standard coloring activity page from a photo they may use or an original written idea. Batch generation, books, teams, commercial licensing, 4K output, and editing are not currently included.' },
      { heading: 'Accounts and credits', body: 'Credits belong to one account. One credit represents one completed standard page. Failed requests return the held credit. Credits cannot be transferred, combined across accounts, or redeemed for cash.' },
      { heading: 'Subscriptions', body: 'Paid plans will renew monthly when they become available. Checkout will show price, taxes, renewal, cancellation, and refund details before purchase.' },
      { heading: 'Availability', body: 'Linea may be changed, interrupted, or unavailable from time to time. Immediate generation and 24/7 support are not guaranteed.' },
    ],
  },
  'acceptable-use': {
    eyebrow: 'Acceptable use policy',
    title: 'Authorized adult input only.',
    intro: 'The product is designed for adults preparing household, homeschool, classroom, or small activity pages without collecting child or student identity data.',
    sections: [
      { heading: 'Allowed input', body: 'Adults may use photos they own or are authorized to use, plus original written themes suitable for a family or general classroom activity.' },
      { heading: 'Prohibited input', body: 'Do not submit student names, photos, rosters, grades, school records, sensitive personal data, unauthorized images, protected characters, public figures, illegal content, or content intended to harass or exploit others.' },
      { heading: 'Product limits', body: 'Linea does not currently support child accounts, classroom rosters, team seats, bulk generation, book production, developer integrations, or commercial publishing rights.' },
      { heading: 'Policy review', body: 'If a request is rejected for policy reasons, its held credit should be returned and the user should receive a clear explanation.' },
    ],
  },
  refunds: {
    eyebrow: 'Refund and cancellation',
    title: 'Refund states must follow real payment events.',
    intro: 'This page avoids promising guaranteed refunds, no-questions refunds, all-sales-final language, or cancellation behavior that has not been configured and tested.',
    sections: [
      { heading: 'Cancellation', body: 'Cancellation timing, period-end access, and any grace period will be shown before paid plans become available.' },
      { heading: 'Refund review', body: 'Undelivered purchases, duplicate charges, and applicable legal rights should enter a real support channel. Eligibility, timing, full or partial refunds, and used-credit treatment remain pending.' },
      { heading: 'Disputes', body: 'Disputes open an entitlement review. Credits or access may be revoked or restored only from trusted payment events and approved policy.' },
      { heading: 'Account updates', body: 'Confirmed refunds and disputes update your credit balance and payment history without hiding earlier activity.' },
    ],
  },
  support: {
    eyebrow: 'Support and complaints',
    title: 'Support categories without exposing private account data.',
    intro: 'Review the available help categories for account, payment, generation, deletion, and complaint questions.',
    sections: [
      { heading: 'Account and login', body: 'Support can help with sign-in, account access, disconnection, and deletion questions. Never send passwords, sign-in codes, or security tokens.' },
      { heading: 'Payment and subscription', body: 'Use an order or subscription reference when available. Never send card numbers, security codes, or other sensitive payment data.' },
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
        These policies describe the current service and may be updated as Linea adds new features.
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
            <h2>Contact support</h2>
            <p>Choose a category and include an order, subscription, or request reference when available.</p>
          </div>
          <form action="#support">
            <label>Category<select disabled><option>Payment / subscription</option></select></label>
            <label>Reference<input disabled placeholder="Optional reference" /></label>
            <label>Message<textarea disabled rows={5} placeholder="Support messaging is coming soon" /></label>
            <button disabled>Support form coming soon</button>
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
        <h1>This page does not exist.</h1>
        <p>The address may be incorrect, or the page may have moved.</p>
        <Link className="primary-button" href="/">Return home <ArrowRight size={17} /></Link>
      </section>
    </ProductLayout>
  )
}
