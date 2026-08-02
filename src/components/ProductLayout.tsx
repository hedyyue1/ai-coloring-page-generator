'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  BadgeCheck,
  CreditCard,
  Home,
  Image as ImageIcon,
  LogIn,
  PanelLeftClose,
  Trash2,
  Type,
  UserRound,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSession } from '@/auth/session'

function NavItem({ end, href, children }: { end?: boolean; href: string; children: ReactNode }) {
  const pathname = usePathname()
  const active = end ? pathname === href : pathname?.startsWith(href)
  return <Link href={href} className={active ? 'active' : undefined}>{children}</Link>
}

type ProductNavItem = { label: string; href: string; icon: LucideIcon }

const mainNav: ProductNavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Photo to Coloring', href: '/photo-to-coloring-page', icon: ImageIcon },
  { label: 'Text to Coloring', href: '/text-to-coloring-page', icon: Type },
  { label: 'Pricing', href: '/pricing', icon: CreditCard },
]

const accountNav: ProductNavItem[] = [
  { label: 'Account', href: '/account', icon: UserRound },
  { label: 'Subscription', href: '/account/subscription', icon: BadgeCheck },
  { label: 'Credit History', href: '/account/credits', icon: WalletCards },
  { label: 'Data & Privacy', href: '/account/data-deletion', icon: Trash2 },
]

const policyLinks = [
  ['Privacy', '/privacy'], ['Terms', '/terms'], ['Acceptable Use', '/acceptable-use'],
  ['Refunds', '/refunds'], ['Support', '/support'],
]

function NavGroup({ title, items }: { title: string; items: ProductNavItem[] }) {
  return (
    <div className="nav-group">
      <p>{title}</p>
      <nav aria-label={title}>
        {items.map((item) => {
          const Icon = item.icon
          return <NavItem end={item.href === '/'} key={item.href} href={item.href}><Icon size={18} /><span>{item.label}</span></NavItem>
        })}
      </nav>
    </div>
  )
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  const session = useSession()
  const signedIn = session.status === 'authenticated'

  return (
    <main className="workspace">
      <aside className="sidebar">
        <Link className="product-logo" href="/" aria-label="Linea home">
          <Image src="/logo.svg" alt="Linea" width={118} height={34} priority />
        </Link>
        <button className="collapse-button" aria-label="Collapse navigation"><PanelLeftClose size={17} /></button>
        <div className="sidebar-scroll">
          <NavGroup title="Create" items={mainNav} />
          {signedIn ? <NavGroup title="Account" items={accountNav} /> : null}
          <div className="sidebar-policies" aria-label="Policies">
            {policyLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </div>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="topbar">
          <div className="status-pill"><span /> Create something worth coloring</div>
          <div className="topbar-actions">
            {signedIn ? (
              <Link className="login-button account" href="/account"><UserRound size={17} /> {session.account.user.name}</Link>
            ) : (
              <Link className="login-button" href="/login"><LogIn size={17} /> Sign in</Link>
            )}
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}
