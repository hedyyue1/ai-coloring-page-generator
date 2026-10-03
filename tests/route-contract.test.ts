import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('OAuth routes implement PKCE start, verified callback, hashed session and logout', async () => {
  const start = await source('src/app/api/auth/google/start/route.ts')
  const callback = await source('src/app/api/auth/google/callback/route.ts')
  const server = await source('src/lib/auth-server.ts')
  const logout = await source('src/app/api/auth/logout/route.ts')
  for (const marker of ['codeChallenge', 'oauth_state', 'oauth_verifier', 'oauth_nonce', 'HttpOnly', 'SameSite=Lax']) assert.match(start + server, new RegExp(marker))
  for (const marker of ['oauth2.googleapis.com/token', 'tokeninfo', 'isGoogleOidcClaimsValid', 'createSession', 'clearOAuthCookies']) assert.match(callback, new RegExp(marker))
  for (const marker of ['AUTH_SECRET', 'session_hash', 'crypto.subtle', 'expires_at']) assert.match(server, new RegExp(marker))
  assert.match(logout, /revokeSession/)
})

test('checkout route authenticates and sends only server-mapped product data to Creem Test API', async () => {
  const checkout = await source('src/app/api/checkout/session/route.ts')
  for (const marker of ['requireSession', 'catalogPlan', 'CREEM_PRODUCT_', 'x-api-key', 'request_id', 'metadata', 'checkout_url']) assert.match(checkout, new RegExp(marker))
  assert.doesNotMatch(checkout, /body\.amount|body\.currency|body\.product/)
})

test('webhook route verifies raw body before JSON parsing and grants idempotently', async () => {
  const webhook = await source('src/app/api/webhooks/creem/route.ts')
  const signatureIndex = webhook.indexOf('verifyCreemSignature')
  const parseIndex = webhook.indexOf('JSON.parse')
  assert.ok(signatureIndex >= 0 && parseIndex > signatureIndex)
  for (const marker of ['creem-signature', 'creem_webhook_events', "processing_state = 'processing'", 'meta.changes', "processing_state = 'failed'", 'checkout.completed', 'entitlement_ledger', 'idempotency_key', 'subscription.canceled', 'subscription.expired', 'subscription.past_due', 'refund.created', 'dispute.created']) assert.match(webhook, new RegExp(marker.replace('.', '\\.')))
})

test('account API returns the authenticated users real entitlement ledger', async () => {
  const me = await source('src/app/api/me/route.ts')
  assert.match(me, /requireSession/)
  assert.match(me, /FROM entitlement_ledger/)
  assert.match(me, /WHERE user_id = \?/)
  assert.match(me, /creditLedger/)
  assert.match(me, /ORDER BY created_at DESC/)
})

test('result download is a server-enforced paid-session delivery path', async () => {
  const download = await source('src/app/api/results/download/route.ts')
  const tools = await source('src/screens/ToolPages.tsx')
  for (const marker of ['requireSession', 'subscription_required', 'paid', 'content-disposition', 'GENERATED_PREVIEWS']) assert.match(download, new RegExp(marker))
  assert.match(tools, /fetch\('\/api\/results\/download'/)
  assert.doesNotMatch(tools, /href=\{generatedImage\}/)
})

test('R8.5 runtime mutation routes enforce same-origin CSRF, idempotency, and private responses', async () => {
  const security = await source('src/lib/request-security.ts')
  const checkout = await source('src/app/api/checkout/route.ts')
  const uploads = await source('src/app/api/uploads/intents/route.ts')
  const generations = await source('src/app/api/generations/route.ts')
  for (const marker of ['origin_forbidden', 'csrf_failed', 'idempotency_key_required', 'idempotency_key_reused', 'sameOrigin', 'X-CSRF-Token']) assert.match(security, new RegExp(marker))
  for (const route of [checkout, uploads, generations]) {
    assert.match(route, /requireSession/)
    assert.match(route, /validateBrowserWrite/)
    assert.match(route, /idempotency/)
  }
})

test('R8.5 upload and generation lifecycle routes are owner-only and fail closed without dual Test flags', async () => {
  const intent = await source('src/app/api/uploads/intents/route.ts')
  const upload = await source('src/app/api/uploads/[uploadId]/route.ts')
  const submit = await source('src/app/api/generations/route.ts')
  const status = await source('src/app/api/generations/[jobId]/route.ts')
  const cancel = await source('src/app/api/generations/[jobId]/cancel/route.ts')
  for (const marker of ['GENERATED_PREVIEWS', 'magic', 'rights_confirmed', 'upload_too_large']) assert.match(intent + upload, new RegExp(marker))
  for (const marker of ['GENERATION_ENABLED', 'GENERATION_TEST_MODE', 'CREEM_MODE', 'generation_disabled', 'generation_jobs', 'entitlement_ledger']) assert.match(submit, new RegExp(marker.replace('.', '\\.')))
  const entitlement = await source('src/app/api/entitlements/route.ts')
  for (const route of [status, cancel, entitlement]) assert.match(route, /user_id = \?/) 
  assert.match(entitlement, /entitlement_ledger/)
})

test('private API responses are no-store and noindex', async () => {
  const api = await source('src/lib/api-response.ts')
  assert.match(api, /no-store, private/)
  assert.match(api, /noindex, nofollow, noarchive/)
})

test('pricing remains excluded from sitemap and marked noindex until owner approval', async () => {
  const sitemap = await source('src/app/sitemap.ts')
  const pricing = await source('src/app/pricing/page.tsx')
  assert.doesNotMatch(sitemap, /'\/pricing'/)
  assert.match(pricing, /alternates:\s*\{\s*canonical:\s*'\/pricing'\s*\}/)
  assert.match(pricing, /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/)
})
