import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) { return readFile(new URL(`../${path}`, import.meta.url), 'utf8') }

test('login starts real Google OAuth and presents generic recovery errors', async () => {
  const login = await source('src/screens/ToolPages.tsx')
  assert.match(login, /\/api\/auth\/google\/start/)
  assert.match(login, /oauth_not_configured/)
  assert.doesNotMatch(login, /OAuth pending R6 configuration/)
})

test('home paid plan CTAs open protected checkout instead of showing purchase closed', async () => {
  const home = await source('src/screens/Home.tsx')
  assert.match(home, /fetch\('\/api\/checkout'/)
  assert.match(home, /X-CSRF-Token/)
  assert.match(home, /Idempotency-Key/)
  assert.match(home, /JSON\.stringify\(\{ plan_id: planId \}\)/)
  assert.match(home, /standard_monthly/)
  assert.doesNotMatch(home, /Purchase closed/i)
})

test('pricing makes Standard the dark primary CTA and other plans secondary', async () => {
  const pricing = await source('src/screens/ToolPages.tsx')
  const styles = await source('src/app/globals.css')
  assert.match(pricing, /plan\.featured \? 'plan-cta primary' : 'plan-cta'/)
  assert.match(styles, /\.price-card\.featured \.plan-cta/)
  assert.match(styles, /background:\s*var\(--gradient\)/)
})

test('pricing posts a fixed plan_id then navigates only to the server checkout URL', async () => {
  const pricing = await source('src/screens/ToolPages.tsx')
  assert.match(pricing, /\/api\/checkout/)
  assert.match(pricing, /X-CSRF-Token/)
  assert.match(pricing, /plan_id/)
  assert.match(pricing, /checkout_url/)
  assert.doesNotMatch(pricing, /Purchase closed pending approval/)
})

test('all account subpages render the signed-in account snapshot instead of sample data', async () => {
  const account = await source('src/screens/AccountPages.tsx')
  assert.match(account, /useAccountSnapshot/)
  assert.match(account, /creditLedger/)
  assert.match(account, /periodEnd/)
  assert.match(account, /Current period ends/)
  for (const stale of ['Current sample plan', 'Free · $0 / month', 'ledger_1001', 'Sample entitlement ledger', '<strong>19</strong>', 'Credit ledger prototype']) {
    assert.doesNotMatch(account, new RegExp(stale, 'i'))
  }
})

test('account fetches real session and entitlement state and can revoke the session', async () => {
  const account = await source('src/screens/AccountPages.tsx')
  const layout = await source('src/components/ProductLayout.tsx')
  assert.match(account, /\/api\/me/)
  assert.match(account, /availableCredits/)
  assert.doesNotMatch(account, /\/api\/auth\/logout/)
  assert.match(layout, /\/api\/auth\/logout/)
  assert.doesNotMatch(account, /Static prototype data only/)
})

test('pending checkout polls authoritative account state without claiming return success', async () => {
  const pending = await source('src/components/CheckoutPendingClient.tsx')
  assert.match(pending, /fetch\(['"]\/api\/me/)
  assert.match(pending, /setInterval/)
  assert.match(pending, /Returning from hosted checkout does not activate a plan/)
  assert.match(pending, /verified Creem webhook/)
})

test('signed-in navigation uses a full-name account menu and removes payment-state clutter', async () => {
  const layout = await source('src/components/ProductLayout.tsx')
  assert.doesNotMatch(layout, /Payment states/)
  assert.doesNotMatch(layout, /href="\/checkout\/pending"/)
  assert.doesNotMatch(layout, /accountInitial|charAt\(0\)/)
  assert.match(layout, /accountUser\?\.displayName \|\| accountUser\?\.email \|\| 'Signed-in user'/)
  assert.match(layout, /aria-label="Account menu"/)
  assert.match(layout, /aria-expanded=/)
  assert.match(layout, />Sign out</)
  assert.match(layout, /\/api\/auth\/logout/)
})

test('global navigation has no environment or payment-status badge', async () => {
  const layout = await source('src/components/ProductLayout.tsx')
  assert.doesNotMatch(layout, /status-pill/)
  assert.doesNotMatch(layout, /Google sign-in · Creem Test/)
  assert.match(layout, /fetch\(['"]\/api\/me/)
})

test('photo upload generates a real browser-local line-art result instead of a prototype notice', async () => {
  const tools = await source('src/screens/ToolPages.tsx')
  assert.match(tools, /generatePhotoLineArt/)
  assert.match(tools, /Generated coloring page/)
  assert.match(tools, /outputCanvas\.toDataURL\('image\/png'\)/)
  assert.doesNotMatch(tools, /Math\.hypot\(gx, gy\) > 118/)
  assert.match(tools, /const outlineThreshold = 38/)
  assert.match(tools, /dilatedOutline/)
  assert.doesNotMatch(tools, /Prototype notice: generation, upload, and credit reservation are not connected yet\./)
})
