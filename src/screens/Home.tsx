'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  Download,
  Fingerprint,
  Image as ImageIcon,
  Printer,
  ShieldCheck,
  Sparkles,
  Type,
  UploadCloud,
  Wand2,
} from 'lucide-react'
import ProductLayout from '../components/ProductLayout'
import ComparisonCard from '../components/ComparisonCard'

const photoFeatures = [
  'Clean, well-balanced outlines for every skill level',
  'Multiple line-art styles to choose from',
  'Instantly printable high-resolution PNG output',
]

const textFeatures = [
  'Describe any theme in your own words',
  'Original scenes for family, homeschool, or relaxation',
  'Same printable quality as the photo tool',
]

const howItWorks = [
  {
    icon: UploadCloud,
    title: 'Upload a photo or write an idea',
    text: 'Choose a photo you own or have permission to use, or describe an original theme in words.',
  },
  {
    icon: Wand2,
    title: 'Preview your coloring page',
    text: 'Create a browser-based preview of your line art. Current photo previews do not deduct credits.',
  },
  {
    icon: Printer,
    title: 'Download and print',
    text: 'PNG downloads require Google sign-in and an eligible subscription. Print at home or in the classroom.',
  },
]

const gallery = [
  {
    src: '/examples/cottage-line.jpg',
    color: '/examples/cottage-color.jpg',
    title: 'Garden cottage',
    alt: 'Line-art coloring page of a cozy garden cottage with flowers and a picket fence',
  },
  {
    src: '/examples/cat-line.jpg',
    color: '/examples/cat-color.jpg',
    title: 'Cozy cat',
    alt: 'Line-art coloring page of a cat sleeping on a cushion in a warm room',
  },
  {
    src: '/examples/camp-line.jpg',
    color: '/examples/camp-color.jpg',
    title: 'Camping memory',
    alt: 'Line-art coloring page of a mountain campsite with a tent and campfire at sunset',
  },
]

const plans = [
  { id: null, name: 'Free', price: '$0', credits: '20', fit: 'For getting started with Google sign-in', featured: false },
  { id: 'starter_monthly', name: 'Starter', price: '$9.99', credits: '200', fit: 'Occasional family or classroom preparation', featured: false },
  { id: 'standard_monthly', name: 'Standard', price: '$19.99', credits: '500', fit: 'Frequent household, homeschool, or teacher use', featured: true },
  { id: 'premium_monthly', name: 'Premium', price: '$39.99', credits: '1,500', fit: 'High-frequency adult activity organizers', featured: false },
]

const faqs = [
  [
    'Why sign in with Google?',
    'Google sign-in lets you view your account and request an eligible download. It does not verify your age or your rights to a photo.',
  ],
  [
    'What is a coloring credit?',
    'The monthly plans use credits for coloring pages. The current browser-based photo preview does not deduct credits; text generation is unavailable.',
  ],
  [
    'What does the Free plan include?',
    'The Free plan allowance is 20 credits per month and requires Google sign-in. Current photo previews do not deduct credits. Free does not mean unlimited use or permanent storage.',
  ],
  [
    'How do I check payment and subscription access?',
    'Returning from checkout is not payment confirmation. Check Account for your subscription status and contact Support if access is missing. Do not pay again to fix a missing status.',
  ],
  [
    'Can teachers upload student materials?',
    'No student accounts, rosters, names, photos, grades, or sensitive school records. Adults may prepare general original themes for classroom use.',
  ],
  [
    'What should I know about downloads and storage?',
    'A generated PNG copy is sent to our server for download. Download access expires after 24 hours; this does not mean every stored copy has been deleted. Downloads require Google sign-in and an eligible subscription.',
  ],
]

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="section-heading">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      {text ? <span>{text}</span> : null}
    </div>
  )
}

function PricingCard({ plan }: { plan: (typeof plans)[number] }) {
  return (
    <article className={plan.featured ? 'price-card featured' : 'price-card'}>
      {plan.featured ? <span className="popular-badge">Recommended</span> : null}
      <div className="plan-heading">
        <h3>{plan.name}</h3>
        <span>monthly</span>
      </div>
      <div className="plan-price"><strong>{plan.price}</strong><span>USD / month</span></div>
      <p><b>{plan.credits}</b> monthly coloring credits</p>
      <p className="plan-fit">{plan.fit}</p>
      <ul>
        <li><Check size={15} /> View your credits in Account</li>
        <li><Check size={15} /> Current photo previews do not deduct credits.</li>
        <li><Check size={15} /> Check your account for confirmed access.</li>
      </ul>
      {plan.id ? (
        <button className={plan.featured ? 'plan-cta primary' : 'plan-cta'} disabled>New purchases unavailable</button>
      ) : <Link className="plan-cta" href="/photo-to-coloring-page">Create a photo preview</Link>}
    </article>
  )
}

export default function Home() {
  return (
    <ProductLayout>
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="hero-kicker"><Sparkles size={14} /> AI coloring page generator</p>
          <h1>Turn photos and ideas into <span>beautiful line art</span> worth coloring.</h1>
          <p className="hero-subtitle">
            Upload a photo you have permission to use — or describe an idea in words — and get a clean,
            printable coloring page. For adults, families, and everyone who loves to color.
          </p>
          <div className="hero-actions">
            <Link href="/photo-to-coloring-page" className="primary-button">Start with a photo <ArrowRight size={18} /></Link>
            <Link href="/text-to-coloring-page" className="secondary-button"><Type size={17} /> Describe an idea</Link>
          </div>
          <div className="hero-assurance">
            <span><Fingerprint size={15} /> Browser-based preview · no credits used</span>
            <span><ShieldCheck size={15} /> Use only photos you own or may use</span>
          </div>
        </div>
        <ComparisonCard />
      </section>

      <section className="panel-section feature-block" id="photo-tool">
        <div className="feature-split">
          <div className="feature-copy">
            <div className="feature-icon photo"><ImageIcon size={22} /></div>
            <h2>Photo to Coloring Page</h2>
            <p>
              Upload any photo you own or are authorized to use, and preview it as clean line art in your
              browser. A generated copy is sent to our server for download once you are signed in.
            </p>
            <ul>
              {photoFeatures.map((feature) => <li key={feature}><Check size={16} /> {feature}</li>)}
            </ul>
            <Link href="/photo-to-coloring-page" className="primary-button">Try the photo tool <ArrowRight size={17} /></Link>
          </div>
          <figure className="feature-pair">
            <div className="pair-item">
              <Image src="/examples/cat-color.jpg" alt="Colorful illustration of a cat sleeping on a cushion" width={640} height={427} sizes="(max-width: 900px) 100vw, 23vw" />
              <span>Photo</span>
            </div>
            <ArrowRight className="pair-arrow" size={26} />
            <div className="pair-item">
              <Image src="/examples/cat-line.jpg" alt="The same cat illustration converted into printable line art" width={640} height={427} sizes="(max-width: 900px) 100vw, 23vw" />
              <span>Line art</span>
            </div>
          </figure>
        </div>
      </section>

      <section className="panel-section feature-block" id="text-tool">
        <div className="feature-split reverse">
          <div className="feature-copy">
            <div className="feature-icon text"><Type size={22} /></div>
            <h2>Text to Coloring Page</h2>
            <p>
              Describe an original theme in your own words — a cozy garden, a seaside picnic, a birthday
              party — and turn it into a one-of-a-kind coloring page. Text generation is currently unavailable.
            </p>
            <ul>
              {textFeatures.map((feature) => <li key={feature}><Check size={16} /> {feature}</li>)}
            </ul>
            <Link href="/text-to-coloring-page" className="secondary-button">Explore the text tool <ArrowRight size={17} /></Link>
          </div>
          <figure className="feature-pair">
            <div className="pair-item prompt-demo">
              <div className="prompt-demo-card">
                <div className="prompt-demo-icon"><Type size={15} /></div>
                <p>“A cozy mountain campsite at sunset, with a small tent, a crackling campfire and tall pine trees.”</p>
                <span className="prompt-demo-hint">Your words become the scene</span>
              </div>
              <span>Your idea</span>
            </div>
            <ArrowRight className="pair-arrow" size={26} />
            <div className="pair-item">
              <Image src="/examples/camp-line.jpg" alt="The campsite idea turned into printable line art" width={640} height={427} sizes="(max-width: 900px) 100vw, 23vw" />
              <span>Line art</span>
            </div>
          </figure>
        </div>
      </section>

      <section className="panel-section" id="how-it-works">
        <SectionHeading
          eyebrow="How it works"
          title="From photo to printable page in three steps"
          text="Choose a permitted photo or write an original theme, preview the result, then download and print."
        />
        <div className="steps-grid">
          {howItWorks.map((step, index) => {
            const Icon = step.icon
            return (
              <article className="step-card" key={step.title}>
                <span className="step-number">{index + 1}</span>
                <div className="step-icon"><Icon size={24} /></div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="panel-section gallery-section" id="examples">
        <SectionHeading
          eyebrow="Illustrative examples"
          title="See the idea before you use your own photo"
          text="These are original illustrations showing the kind of before-and-line-art comparison you can expect. They are examples, not generated customer results."
        />
        <div className="gallery-grid">
          {gallery.map((item) => (
            <figure className="gallery-card" key={item.title}>
              <div className="gallery-images">
                <Image src={item.color} alt="" width={640} height={427} sizes="(max-width: 900px) 50vw, 16vw" />
                <Image src={item.src} alt={item.alt} width={640} height={427} sizes="(max-width: 900px) 50vw, 16vw" />
              </div>
              <figcaption>
                <strong>{item.title}</strong>
                <span>Color reference → printable line art</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="examples-cta">
          <p>Ready to try a photo you own or have permission to use?</p>
          <Link href="/photo-to-coloring-page" className="primary-button">Create a photo preview <ArrowRight size={18} /></Link>
        </div>
      </section>

      <section className="panel-section pricing-section" id="pricing">
        <SectionHeading
          eyebrow="Monthly plans — new purchases unavailable"
          title="Compare monthly plans"
          text="New purchases are currently unavailable. You can compare monthly plans below; no purchase can be made here."
        />
        <div className="pricing-grid">
          {plans.map((plan) => <PricingCard key={plan.name} plan={plan} />)}
        </div>

        <div className="pricing-note">
          <CreditCard size={18} />
          These paid plans are monthly subscriptions. New purchases are unavailable. Before any purchase becomes available, review renewal, cancellation and total-price details.
        </div>
      </section>

      <section className="panel-section faq-section" id="faq">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions about previews, downloads and your account"
        />
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
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

      <section className="final-cta">
        <div>
          <p><Download size={14} /> Create a photo preview</p>
          <h2>Start with a photo you have permission to use.</h2>
        </div>
        <Link href="/photo-to-coloring-page">Try the photo preview <ArrowRight size={18} /></Link>
      </section>
    </ProductLayout>
  )
}
