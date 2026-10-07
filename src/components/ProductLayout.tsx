'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import {
  BadgeCheck,
  CreditCard,
  Home,
  Image as ImageIcon,
  LogIn,
  Menu,
  Trash2,
  Type,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSession } from '@/auth/session'

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

function NavItem({ end, href, children, onClick }: { end?: boolean; href: string; children: ReactNode; onClick?: () => void }) {
  const pathname = usePathname()
  const active = end ? pathname === href : pathname?.startsWith(href)
  return <Link href={href} className={active ? 'active' : undefined} onClick={onClick}>{children}</Link>
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  const session = useSession()
  const signedIn = session.status === 'authenticated'
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const onAccountPage = pathname?.startsWith('/account')

  return (
    <main className="workspace">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="product-logo" href="/" aria-label="Linea home">
            <Image src="/logo.svg" alt="Linea" width={90} height={34} priority />
          </Link>

          <nav className="main-nav" aria-label="Main navigation">
            {mainNav.map((item) => (
              <NavItem end={item.href === '/'} key={item.href} href={item.href}>
                <span>{item.label}</span>
              </NavItem>
            ))}
            {signedIn ? (
              <NavItem href="/account">
                <span>Account</span>
              </NavItem>
            ) : null}
          </nav>

          <div className="topbar-actions">
            {signedIn ? (
              <Link className="login-button account" href="/account"><UserRound size={17} /> {session.account.user.name}</Link>
            ) : (
              <Link className="login-button" href="/login"><LogIn size={17} /> Sign in</Link>
            )}
            <button
              className="menu-toggle"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {mainNav.map((item) => {
              const Icon = item.icon
              return (
                <NavItem end={item.href === '/'} key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                  <Icon size={18} /><span>{item.label}</span>
                </NavItem>
              )
            })}
            {signedIn
              ? accountNav.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavItem key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                      <Icon size={18} /><span>{item.label}</span>
                    </NavItem>
                  )
                })
              : null}
            <div className="mobile-nav-policies">
              {policyLinks.map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>
              ))}
            </div>
          </nav>
        ) : null}

        {signedIn && onAccountPage ? (
          <nav className="account-subnav" aria-label="Account navigation">
            {accountNav.map((item) => {
              const Icon = item.icon
              return (
                <NavItem key={item.href} href={item.href}>
                  <Icon size={16} /><span>{item.label}</span>
                </NavItem>
              )
            })}
          </nav>
        ) : null}
      </header>

      <div className="workspace-main">
        {children}
        <footer className="site-footer">
          <div className="site-footer-inner">
            <Link className="product-logo" href="/" aria-label="Linea home">
              <Image src="/logo-light.svg" alt="Linea" width={79} height={30} />
            </Link>
            <p>Create something worth coloring</p>
            <nav aria-label="Policies">
              {policyLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
            </nav>
          </div>
        </footer>
      </div>
    </main>
  )
}
