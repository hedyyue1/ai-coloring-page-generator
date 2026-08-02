'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BadgeCheck,
  CreditCard,
  Home,
  Image as ImageIcon,
  LogIn,
  PanelLeftClose,
  Route,
  ShieldCheck,
  Trash2,
  Type,
  UserRound,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'


function NavItem({ end, href, className, children, ...rest }: { end?: boolean; href: string; className?: string; children: ReactNode }) {
  const pathname = usePathname()
  const active = end ? pathname === href : pathname?.startsWith(href)
  const cls = [className, active ? 'active' : ''].filter(Boolean).join(' ')
  return <Link href={href} className={cls || undefined} {...rest}>{children}</Link>
}

type ProductNavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const mainNav: ProductNavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Photo to Coloring', href: '/photo-to-coloring-page', icon: ImageIcon },
  { label: 'Text to Coloring', href: '/text-to-coloring-page', icon: Type },
  { label: 'Pricing', href: '/pricing', icon: CreditCard },
]

const accountNav: ProductNavItem[] = [
  { label: 'Login', href: '/login', icon: LogIn },
  { label: 'Account', href: '/account', icon: UserRound },
  { label: 'Subscription', href: '/account/subscription', icon: BadgeCheck },
  { label: 'Credit Ledger', href: '/account/credits', icon: WalletCards },
  { label: 'Data Deletion', href: '/account/data-deletion', icon: Trash2 },
]

const policyLinks = [
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
  ['Acceptable Use', '/acceptable-use'],
  ['Refunds', '/refunds'],
  ['Support', '/support'],
]

function NavGroup({ title, items }: { title: string; items: ProductNavItem[] }) {
  return (
    <div className="nav-group">
      <p>{title}</p>
      <nav aria-label={title}>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavItem end={item.href === '/'} key={item.href} href={item.href}>
              <Icon size={18} />
              <span>{item.label}</span>
            </NavItem>
          )
        })}
      </nav>
    </div>
  )
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAccountArea = pathname?.startsWith('/account')

  return (
    <main className="workspace">
      <aside className="sidebar">
        <Link className="product-logo" href="/" aria-label="Linea home">
          <span><ImageIcon size={20} /></span>
          <strong>Linea</strong>
        </Link>
        <button className="collapse-button" aria-label="Collapse navigation preview">
          <PanelLeftClose size={17} />
        </button>

        <div className="sidebar-scroll">
          <NavGroup title="Create" items={mainNav} />
          <NavGroup title="Account" items={accountNav} />
          <div className="sidebar-note">
            <ShieldCheck size={17} />
            <p><strong>Frontend prototype</strong> No real OAuth, checkout, generation, or persistence is connected.</p>
          </div>
          <div className="sidebar-policies" aria-label="Policies">
            {policyLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </div>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="topbar">
          <div className="status-pill"><span /> V5 prototype · checkout disabled</div>
          <div className="topbar-actions">
            <Link className="state-link" href="/checkout/pending"><Route size={16} /> Payment states</Link>
            {isAccountArea ? (
              <Link className="login-button account" href="/account"><UserRound size={17} /> Demo account</Link>
            ) : (
              <Link className="login-button" href="/login"><LogIn size={17} /> Login prototype</Link>
            )}
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}
