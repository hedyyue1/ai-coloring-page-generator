'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CreditCard,
  Home,
  Image as ImageIcon,
  LogIn,
  Type,
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
  const [accountUser, setAccountUser] = useState<{ email?: string | null; displayName?: string | null } | null | undefined>(undefined)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const accountButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let active = true
    fetch('/api/me', { cache: 'no-store' })
      .then(async (response) => await response.json() as { user?: { email?: string | null; displayName?: string | null } | null })
      .then((result) => { if (active) setAccountUser(result.user ?? null) })
      .catch(() => { if (active) setAccountUser(null) })
    return () => { active = false }
  }, [pathname])

  useEffect(() => setAccountMenuOpen(false), [pathname])

  useEffect(() => {
    if (!accountMenuOpen) return
    const closeOutside = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false)
        accountButtonRef.current?.focus()
      }
    }
    accountMenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountMenuOpen])

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.assign('/login')
  }

  const accountLabel = accountUser?.displayName || accountUser?.email || 'Signed-in user'

  return (
    <main className="workspace">
      <aside className="sidebar">
        <Link className="product-logo" href="/" aria-label="Linea home">
          <span><ImageIcon size={20} /></span>
          <strong>Linea</strong>
        </Link>
        <div className="sidebar-scroll">
          <NavGroup title="Create" items={mainNav} />
          <div className="sidebar-policies" aria-label="Policies">
            {policyLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </div>
        </div>
      </aside>

      <div className="workspace-main">
      <header className="topbar">
      <div className="topbar-actions">
            {accountUser ? (
              <div className="account-menu" ref={accountMenuRef}>
                <button
                  ref={accountButtonRef}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                  aria-controls="account-menu-actions"
                  className="account-name-button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  type="button"
                >
                  {accountLabel}
                </button>
                {accountMenuOpen ? (
                  <div className="account-menu-popover" id="account-menu-actions" role="menu" aria-label="Account actions"
                    onKeyDown={(event) => {
                      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                        event.preventDefault()
                        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'))
                        const index = items.indexOf(document.activeElement as HTMLElement)
                        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length
                        items[next]?.focus()
                      } else if (event.key === 'Tab') setAccountMenuOpen(false)
                    }}>
                    <Link href="/account" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Account</Link>
                    <button type="button" role="menuitem" onClick={signOut}>Sign out</button>
                  </div>
                ) : null}
              </div>
            ) : accountUser === null ? (
              <Link className="login-button" href="/login"><LogIn size={17} /> Google sign-in</Link>
            ) : (
              <span className="state-link" aria-live="polite">Checking sign-in…</span>
            )}
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}
