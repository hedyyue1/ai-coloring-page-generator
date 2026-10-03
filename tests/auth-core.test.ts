import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildGoogleAuthorizationUrl,
  googleIdentityProfile,
  isGoogleOidcClaimsValid,
  safeReturnTo,
} from '../src/lib/auth-core'

test('OAuth without an explicit return path defaults to the account page', () => {
  assert.equal(safeReturnTo(null), '/account')
  assert.equal(safeReturnTo(undefined), '/account')
  assert.equal(safeReturnTo(''), '/account')
})

test('safeReturnTo accepts a local checkout path and rejects external or protocol-relative URLs', () => {
  assert.equal(safeReturnTo('/pricing?plan=standard_monthly'), '/pricing?plan=standard_monthly')
  assert.equal(safeReturnTo('https://evil.example/steal'), '/')
  assert.equal(safeReturnTo('//evil.example/steal'), '/')
  assert.equal(safeReturnTo('/\\evil.example/steal'), '/')
  assert.equal(safeReturnTo('/api/auth/google/callback'), '/')
})

for (const input of [
  '/\t/evil.example', '/\n/evil.example', '/\r/evil.example',
  '//evil.example/steal', '/\\evil.example/steal', '/\t\\evil.example',
  'javascript:alert(1)', 'http://evil.example', 'https://evil.example',
  '/%2f%2fevil.example', '/%2F/evil.example', '/%5cevil.example',
  '/foo/../../api/auth/google/callback', '/foo/../webhooks/payment',
  '/foo/%2e%2e/api/auth/google/callback', '/api', '/webhooks',
  '/foo/..//evil.example', '/api?next=/account', '/webhooks#payment',
]) {
  test(`safeReturnTo rejects unsafe destination ${JSON.stringify(input)}`, () => {
    const output = safeReturnTo(input)
    assert.equal(output, '/')
    assert.equal(new URL(output, 'https://site.example').origin, 'https://site.example')
  })
}

test('safeReturnTo preserves local query/hash and normalizes safe dot segments', () => {
  for (const [input, expected] of [
    ['/account', '/account'],
    ['/pricing?plan=standard_monthly#checkout', '/pricing?plan=standard_monthly#checkout'],
    ['/tools/../account?tab=credits#balance', '/account?tab=credits#balance'],
    ['/apiary?next=https://example.com', '/apiary?next=https://example.com'],
    ['/account?next=%2Fpricing', '/account?next=%2Fpricing'],
  ]) {
    assert.equal(safeReturnTo(input), expected)
  }
})

test('Google authorization URL carries exact callback, OIDC scopes, state, nonce and PKCE S256', () => {
  const url = new URL(buildGoogleAuthorizationUrl({
    clientId: 'client.apps.googleusercontent.com',
    redirectUri: 'https://example.com/api/auth/google/callback',
    state: 'state-value',
    nonce: 'nonce-value',
    codeChallenge: 'challenge-value',
  }))

  assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth')
  assert.equal(url.searchParams.get('client_id'), 'client.apps.googleusercontent.com')
  assert.equal(url.searchParams.get('redirect_uri'), 'https://example.com/api/auth/google/callback')
  assert.equal(url.searchParams.get('scope'), 'openid email profile')
  assert.equal(url.searchParams.get('state'), 'state-value')
  assert.equal(url.searchParams.get('nonce'), 'nonce-value')
  assert.equal(url.searchParams.get('code_challenge'), 'challenge-value')
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
})

test('OIDC claims require issuer, audience, expiry, nonce and stable subject', () => {
  const now = 2_000_000_000
  const valid = {
    iss: 'https://accounts.google.com',
    aud: 'client-id',
    exp: String(now + 300),
    sub: 'google-subject',
    nonce: 'expected-nonce',
    email_verified: 'true',
  }

  assert.equal(isGoogleOidcClaimsValid(valid, 'client-id', 'expected-nonce', now), true)
  assert.equal(isGoogleOidcClaimsValid({ ...valid, aud: 'other-client' }, 'client-id', 'expected-nonce', now), false)
  assert.equal(isGoogleOidcClaimsValid({ ...valid, exp: String(now - 1) }, 'client-id', 'expected-nonce', now), false)
  assert.equal(isGoogleOidcClaimsValid({ ...valid, nonce: 'wrong' }, 'client-id', 'expected-nonce', now), false)
  assert.equal(isGoogleOidcClaimsValid({ ...valid, sub: '' }, 'client-id', 'expected-nonce', now), false)
})

test('Google identity profile stores email only when Google verified it', () => {
  assert.deepEqual(googleIdentityProfile({ email: 'verified@example.com', email_verified: true, name: 'Verified User' }), {
    email: 'verified@example.com',
    displayName: 'Verified User',
    emailVerified: true,
  })
  assert.deepEqual(googleIdentityProfile({ email: 'unverified@example.com', email_verified: false, name: 'Unverified User' }), {
    email: null,
    displayName: 'Unverified User',
    emailVerified: false,
  })
})
