import type { ReactNode } from 'react'

export default function PageHeader({ eyebrow, title, text, actions }: { eyebrow: string; title: string; text: string; actions?: ReactNode }) {
  return <header className="page-heading-block">
    <div><p className="hero-kicker">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div>
    {actions && <div className="page-heading-actions">{actions}</div>}
  </header>
}
