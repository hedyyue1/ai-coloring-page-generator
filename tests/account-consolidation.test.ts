import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const user = {
  id: 'fixture-account', email: 'fixture@example.invalid', displayName: 'Full Fixture Name',
  createdAt: '2026-01-01', availableCredits: 200,
  subscription: { planId: 'starter_monthly', status: 'paid', periodEnd: '2026-11-01' },
}
const snapshot = {
  user, error: '', creditLedger: [{ id: 'fixture-grant', planId: 'starter_monthly', eventType: 'fixture_grant', delta: 200, referenceId: 'fixture-reference', createdAt: '2026-10-01' }],
}

// Render the actual TSX with only framework routing/effects and session state isolated.
function load(path: string, states: unknown[], mocks: Record<string, unknown> = {}) {
  let index = 0
  const module = { exports: {} as Record<string, React.ComponentType> }
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: (id: string) => {
      if (id in mocks) return mocks[id]
      if (id === 'react') return { ...React, useEffect: () => {}, useRef: () => ({ current: null }), useState: (initial: unknown) => [index < states.length ? states[index++] : initial, () => {}] }
      if (id === 'next/navigation') return { usePathname: () => '/account' }
      if (id === 'next/link') return { __esModule: true, default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => React.createElement('a', props, children) }
      return require(id)
    },
  })
  return module.exports
}

function layoutHtml(identity: unknown, open = true) {
  const Layout = load('src/components/ProductLayout.tsx', [identity, open]).default
  return renderToStaticMarkup(React.createElement(Layout, {}, 'Content'))
}

function accountHtml(state: unknown) {
  const pages = load('src/screens/AccountPages.tsx', [state], {
    '../components/ProductLayout': { __esModule: true, default: ({ children }: { children: React.ReactNode }) => React.createElement('main', {}, children) },
    '../components/CheckoutPendingClient': { __esModule: true, default: () => null },
  })
  return renderToStaticMarkup(React.createElement(pages.AccountPage))
}

test('sidebar omits the Account and Test payments explanation in source and rendered states', () => {
  const source = readFileSync(new URL('../src/components/ProductLayout.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /Account &(?:amp;)? Test payments|Test payments|sidebar-note/)
  for (const identity of [user, null, undefined]) {
    const sidebar = layoutHtml(identity, false).match(/<aside[\s\S]*?<\/aside>/)![0]
    assert.doesNotMatch(sidebar, /Account &(?:amp;)? Test payments|Test payments|sidebar-note/)
    for (const href of ['/', '/photo-to-coloring-page', '/text-to-coloring-page', '/pricing', '/privacy', '/terms', '/support']) assert.ok(sidebar.includes(`href="${href}"`), href)
  }
})

test('signed-in navigation displays full identity, no account sidebar, and exactly two menu actions', () => {
  const html = layoutHtml(user)
  assert.match(html, />Full Fixture Name<\/button>/)
  const sidebar = html.match(/<aside[\s\S]*?<\/aside>/)![0]
  assert.doesNotMatch(sidebar, /href="\/(?:login|account)/)
  assert.doesNotMatch(sidebar, /aria-label="Account"/)
  assert.match(html, /aria-expanded="true"/)
  assert.match(html, /aria-haspopup="menu"/)
  const menu = html.match(/<div[^>]*role="menu"[\s\S]*?<\/div>/)![0]
  assert.equal((menu.match(/role="menuitem"/g) || []).length, 2)
  assert.match(menu, /href="\/account"[^>]*>Account<\/a>/)
  assert.match(menu, />Sign out<\/button>/)
})

test('identity falls back to email, then Signed-in user; guests have only topbar sign-in', () => {
  assert.match(layoutHtml({ email: 'fallback@example.invalid' }), />fallback@example.invalid<\/button>/)
  assert.match(layoutHtml({}), />Signed-in user<\/button>/)
  const guest = layoutHtml(null, false)
  assert.match(guest, /Google sign-in/)
  assert.doesNotMatch(guest, /role="menu"/)
  assert.doesNotMatch(guest.match(/<aside[\s\S]*?<\/aside>/)![0], /href="\/(?:login|account)/)
})

test('account renders compact actual subscription, balance, ledger and truthful deletion notice', () => {
  const html = accountHtml(snapshot)
  for (const text of ['Starter · $9.99 / month', 'Status: paid', 'Current period ends', 'fixture_grant', 'Self-service deletion is not available', 'Deletion requires confirmation', 'payment records may be retained', 'Contact support']) assert.ok(html.includes(text), text)
  assert.equal((html.match(/Available credits/g) || []).length, 1)
  assert.equal((html.match(/Full Fixture Name/g) || []).length, 1)
  assert.equal((html.match(/fixture@example.invalid/g) || []).length, 1)
  assert.doesNotMatch(html, /Session|Sign out|Google-linked|lifecycle-row|lifecycle-card|credit-summary-row|deletion-scope-row|deletion-scope-card|account-metric-card|fixture-reference|Account subscription data|Granted|Ledger events|Last updated|<th>Plan|<th>Reference|<button disabled/)
  assert.doesNotMatch(html, /href="\/account\/(?:subscription|credits|data-deletion)/)
})

test('account shows only the latest five ledger entries with Date/Event/Amount columns', () => {
  const creditLedger = Array.from({ length: 8 }, (_, index) => ({ ...snapshot.creditLedger[0], id: `event-${index}`, eventType: `recent-event-${index}` }))
  const html = accountHtml({ ...snapshot, creditLedger })
  assert.equal((html.match(/<tbody>[\s\S]*?<\/tbody>/)![0].match(/<tr>/g) || []).length, 5)
  for (let index = 0; index < 8; index++) assert.equal(html.includes(`recent-event-${index}`), index < 5)
  assert.match(html, /<thead><tr><th>Date<\/th><th>Event<\/th><th>Amount<\/th><\/tr><\/thead>/)
})

test('account preserves no-subscription, empty-ledger, guest, loading and failure states', () => {
  const empty = accountHtml({ ...snapshot, user: { ...user, availableCredits: 0, subscription: null }, creditLedger: [] })
  assert.match(empty, /No paid subscription/)
  assert.match(empty, /No credit events have been recorded/)
  assert.match(empty, /No renewal date/)
  for (const state of [{ user: null, error: '', creditLedger: [] }, { user: undefined, error: '', creditLedger: [] }, { ...snapshot, error: 'Account state could not be loaded.' }]) {
    const html = accountHtml(state)
    assert.doesNotMatch(html, /fixture-reference|Request deletion|Full Fixture Name/)
  }
})

test('legacy account routes redirect to the single canonical account without rendering subpages', () => {
  for (const route of ['subscription', 'credits', 'data-deletion']) {
    let destination: string | undefined
    const Page = load(`src/app/account/${route}/page.tsx`, [], {
      'next/navigation': { redirect: (path: string) => { destination = path; throw new Error('NEXT_REDIRECT') } },
      '@/screens/AccountPages': { SubscriptionPage: () => null, CreditsPage: () => null, DataDeletionPage: () => null },
    }).default
    assert.throws(() => renderToStaticMarkup(React.createElement(Page)), /NEXT_REDIRECT/)
    assert.equal(destination, '/account')
  }
})
