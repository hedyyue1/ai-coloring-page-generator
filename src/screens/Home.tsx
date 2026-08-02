'use client'

import Link from 'next/link'
import { ArrowRight, Check, Image as ImageIcon, ShieldCheck, Sparkles, Type } from 'lucide-react'
import ProductLayout from '@/components/ProductLayout'

const features = [
  { icon: ImageIcon, title: 'Photo to coloring page', text: 'Transform a favorite photo into crisp, printable line art.', href: '/photo-to-coloring-page' },
  { icon: Type, title: 'Text to coloring page', text: 'Describe a scene and create a unique page from your imagination.', href: '/text-to-coloring-page' },
  { icon: Sparkles, title: 'Clean printable results', text: 'Simple outlines designed for relaxed, enjoyable coloring.', href: '/pricing' },
]

const faqs = [
  ['What counts as one credit?', 'One successfully created standard coloring page uses one credit.'],
  ['Can I use photos and text?', 'Yes. Both creation tools use the same credit balance.'],
  ['What photos work best?', 'Use a well-lit image with a clear subject and a simple background.'],
  ['Can I try Linea for free?', 'A free plan is available with 20 monthly credits after sign-in.'],
]

export default function Home() {
  return <ProductLayout><div className="page-shell home-shell">
    <section className="hero-section"><div className="hero-copy"><p className="hero-kicker">AI coloring page generator</p><h1>Turn your ideas into pages worth coloring.</h1><p>Transform photos or simple descriptions into clean, printable coloring pages in moments.</p><div className="hero-actions"><Link className="primary-button" href="/photo-to-coloring-page">Start with a photo <ArrowRight size={17}/></Link><Link className="secondary-button" href="/text-to-coloring-page">Describe an idea</Link></div><ul className="hero-trust"><li><Check size={15}/>20 free monthly credits</li><li><Check size={15}/>Photo and text tools</li><li><Check size={15}/>Printable output</li></ul></div><div className="hero-visual"><div className="floating-card first"><ImageIcon/><span>Your photo</span></div><div className="hero-art"><Sparkles size={52}/><strong>Imagine it.<br/>Color it.</strong></div><div className="floating-card second"><Type/><span>Your words</span></div></div></section>
    <section className="section-block"><div className="section-heading"><p>Ways to create</p><h2>Start with a photo or a few words.</h2><span>Choose the path that fits your idea.</span></div><div className="feature-grid">{features.map(({icon:Icon,...feature}) => <Link key={feature.title} href={feature.href}><Icon/><h3>{feature.title}</h3><p>{feature.text}</p><span>Try it <ArrowRight size={15}/></span></Link>)}</div></section>
    <section className="credit-story"><div><p className="hero-kicker">Simple credits</p><h2>One page, one credit.</h2><p>Your photo and text creations use one shared balance, so it is always easy to understand what you have left.</p><Link href="/pricing">View pricing <ArrowRight size={16}/></Link></div><article><ShieldCheck size={30}/><h3>Your content, your choice</h3><p>Only upload photos and ideas you own or have permission to use.</p></article></section>
    <section className="faq-section"><div className="section-heading"><p>FAQ</p><h2>Good to know.</h2></div><div className="faq-list">{faqs.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
    <footer className="footer-bar"><span>© Linea</span><span>Made for creative, printable moments.</span></footer>
  </div></ProductLayout>
}
