import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'

const origins = [
  'https://ai-coloring-page-generator.hedyyue1.workers.dev',
  'https://coloringpageflow.com',
  'https://www.coloringpageflow.com',
]
const fallback = `${origins[0]}/api/auth/google/callback`

// Bundle real handlers; replace only the Cloudflare context boundary. Google and
// D1 fixtures are local unit-test doubles, not production/E2E evidence.
async function handlers() {
  const built = await build({
    stdin: { contents: `export { GET as start } from './src/app/api/auth/google/start/route';
      export { GET as callback } from './src/app/api/auth/google/callback/route';
      export * from './src/lib/auth-core';`, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: [{ name: 'fixture-context', setup(builder) {
      builder.onResolve({ filter: /^@opennextjs\/cloudflare$/ }, () => ({ path: 'context', namespace: 'fixture' }))
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
        contents: 'export async function getCloudflareContext() { return {env: globalThis.__oauthTestEnv} }', loader: 'js',
      }))
    } }],
  })
  return import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`)
}

test('real OAuth handlers keep authorization, exchange and session redirects on each trusted host', async () => {
  const app = await handlers()
  const originalFetch = globalThis.fetch
  const globals = globalThis as typeof globalThis & { __oauthTestEnv?: unknown }
  const writes: string[] = []
  const db = { prepare(sql: string) { return {
    bind() { return this },
    async first() { return { user_id: 'fixture-user' } },
    async run() { writes.push(sql); return {} },
  } } }
  globals.__oauthTestEnv = {
    SITE_URL: origins[0], GOOGLE_REDIRECT_URI: fallback, AUTH_ENABLED: 'true',
    GOOGLE_CLIENT_ID: 'fixture-client', GOOGLE_CLIENT_SECRET: 'fixture-secret', AUTH_SECRET: 'fixture-session-secret', DB: db,
  }
  try {
    for (const origin of [...origins, 'https://unknown.example', 'http://coloringpageflow.com', 'https://coloringpageflow.com:8443']) {
      const trustedOrigin = origins.includes(origin) ? origin : origins[0]
      for (const [returnTo, expected] of [
        ['/pricing?plan=standard_monthly#checkout', '/pricing?plan=standard_monthly#checkout'],
        ['//evil.example', '/'], ['/foo/../api/auth/google/start', '/'],
        ['/\t/evil.example', '/'], ['/account', '/account'],
      ]) {
        const start = await app.start(new Request(`${origin}/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`, {
          headers: { host: 'evil.example', 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'http' },
        }))
        assert.equal(start.status, 307)
        assert.equal(start.headers.get('cache-control'), 'no-store, private')
        const auth = new URL(start.headers.get('location')!)
        assert.equal(auth.searchParams.get('redirect_uri'), `${trustedOrigin}/api/auth/google/callback`)
        const cookies = start.headers.getSetCookie()
        assert.equal(cookies.length, 4)
        for (const cookie of cookies) {
          assert.match(cookie, /^__Host-/)
          assert.match(cookie, /Path=\/; Max-Age=600; HttpOnly; Secure; SameSite=Lax/)
          assert.doesNotMatch(cookie, /Domain=/i)
        }
        const jar = cookies.map((cookie: string) => cookie.split(';')[0]).join('; ')
        let exchanges = 0
        globalThis.fetch = async (input, init) => {
          if (String(input) === 'https://oauth2.googleapis.com/token') {
            exchanges++
            const body = new URLSearchParams(String(init?.body))
            assert.equal(body.get('redirect_uri'), auth.searchParams.get('redirect_uri'))
            assert.equal(body.get('grant_type'), 'authorization_code')
            assert.ok(body.get('code_verifier'))
            return Response.json({ id_token: 'fixture-id-token' })
          }
          assert.ok(String(input).startsWith('https://oauth2.googleapis.com/tokeninfo?'))
          return Response.json({ iss: 'https://accounts.google.com', aud: 'fixture-client', sub: 'fixture-subject',
            nonce: auth.searchParams.get('nonce'), exp: String(Math.floor(Date.now() / 1000) + 300) })
        }
        const callback = await app.callback(new Request(`${origin}/api/auth/google/callback?code=fixture-code&state=${auth.searchParams.get('state')}`, { headers: { cookie: jar, host: 'evil.example' } }))
        assert.equal(exchanges, 1)
        assert.equal(callback.status, 307)
        assert.equal(callback.headers.get('location'), `${trustedOrigin}${expected}`)
        assert.equal(callback.headers.get('cache-control'), 'no-store, private')
        assert.ok(callback.headers.getSetCookie().some((cookie: string) => cookie.startsWith('__Host-linea_session=')))
        assert.equal(callback.headers.getSetCookie().filter((cookie: string) => cookie.includes('Max-Age=0')).length, 4)
      }
      globalThis.fetch = async () => { throw new Error('invalid state must not exchange tokens') }
      const invalid = await app.callback(new Request(`${origin}/api/auth/google/callback?code=fixture&state=wrong`))
      assert.equal(invalid.headers.get('location'), `${trustedOrigin}/login?error=invalid_oauth_state`)
      assert.equal(invalid.status, 307)
      assert.equal(invalid.headers.getSetCookie().length, 4)
      const cancelled = await app.callback(new Request(`${origin}/api/auth/google/callback?error=access_denied`))
      assert.equal(cancelled.headers.get('location'), `${trustedOrigin}/login?error=sign_in_cancelled`)

      const started = await app.start(new Request(`${origin}/api/auth/google/start`))
      const auth = new URL(started.headers.get('location')!)
      const jar = started.headers.getSetCookie().map((cookie: string) => cookie.split(';')[0]).join('; ')
      const callbackUrl = `${origin}/api/auth/google/callback?code=fixture&state=${auth.searchParams.get('state')}`
      const before = writes.length
      for (const name of ['state', 'verifier', 'nonce']) {
        const missingCookie = jar.split('; ').filter((cookie: string) => !cookie.startsWith(`__Host-linea_oauth_${name}=`)).join('; ')
        const rejected = await app.callback(new Request(callbackUrl, { headers: { cookie: missingCookie } }))
        assert.equal(rejected.headers.get('location'), `${trustedOrigin}/login?error=invalid_oauth_state`)
      }
      for (const failure of ['token-denied', 'wrong-nonce']) {
        globalThis.fetch = async (input) => {
          if (String(input) === 'https://oauth2.googleapis.com/token') {
            return failure === 'token-denied' ? new Response(null, { status: 400 }) : Response.json({ id_token: 'fixture' })
          }
          return Response.json({ iss: 'https://accounts.google.com', aud: 'fixture-client', sub: 'fixture',
            nonce: 'wrong-nonce', exp: String(Math.floor(Date.now() / 1000) + 300) })
        }
        const rejected = await app.callback(new Request(callbackUrl, { headers: { cookie: jar } }))
        assert.equal(rejected.status, 307)
        assert.equal(rejected.headers.get('location'), `${trustedOrigin}/login?error=sign_in_failed`)
        assert.equal(rejected.headers.getSetCookie().length, 4)
      }
      assert.equal(writes.length, before, 'failed OAuth must not write user/session rows')
      const configured = globals.__oauthTestEnv
      globals.__oauthTestEnv = { SITE_URL: origins[0], GOOGLE_REDIRECT_URI: fallback }
      const unavailable = await app.start(new Request(`${origin}/api/auth/google/start`))
      assert.equal(unavailable.status, 307)
      assert.equal(unavailable.headers.get('location'), `${trustedOrigin}/login?error=oauth_not_configured`)
      assert.equal(unavailable.headers.getSetCookie().length, 0)
      globals.__oauthTestEnv = configured
    }
    assert.ok(writes.some(sql => sql.startsWith('INSERT INTO sessions')))
  } finally {
    globalThis.fetch = originalFetch
    delete globals.__oauthTestEnv
  }
})

test('disabled OAuth callback rejects valid pending transactions on all three hosts without side effects', async () => {
  const app = await handlers()
  const originalFetch = globalThis.fetch
  const globals = globalThis as typeof globalThis & { __oauthTestEnv?: unknown }
  const originalEnv = globals.__oauthTestEnv
  let fetches = 0
  let dbAccesses = 0
  const configured = {
    SITE_URL: origins[0], GOOGLE_REDIRECT_URI: fallback, AUTH_ENABLED: 'true',
    GOOGLE_CLIENT_ID: 'fixture-client', GOOGLE_CLIENT_SECRET: 'fixture-secret', AUTH_SECRET: 'fixture-session-secret',
    DB: { prepare() { dbAccesses++; throw new Error('disabled callback must not access D1') },
      batch() { dbAccesses++; throw new Error('disabled callback must not write D1') } },
  }
  try {
    globalThis.fetch = async () => { fetches++; throw new Error('disabled callback must not fetch Google') }
    for (const origin of origins) {
      globals.__oauthTestEnv = configured
      const start = await app.start(new Request(`${origin}/api/auth/google/start?returnTo=%2Fpricing%3Fx%3D1%23checkout`))
      const auth = new URL(start.headers.get('location')!)
      const jar = start.headers.getSetCookie().map((cookie: string) => cookie.split(';')[0]).join('; ')
      for (const authEnabled of ['false', undefined]) {
        const env: Record<string, unknown> = { ...configured }
        if (authEnabled === undefined) delete env.AUTH_ENABLED
        else env.AUTH_ENABLED = authEnabled
        globals.__oauthTestEnv = env
        const response = await app.callback(new Request(`${origin}/api/auth/google/callback?code=fixture-code&state=${auth.searchParams.get('state')}`, {
          headers: { cookie: jar, host: 'evil.example', 'x-forwarded-host': 'evil.example' },
        }))
        assert.equal(response.status, 307)
        assert.equal(response.headers.get('location'), `${origin}/login?error=oauth_not_configured`, `${origin}: AUTH_ENABLED=${authEnabled}`)
        assert.equal(response.headers.get('cache-control'), 'no-store, private')
        assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive')
        const cookies = response.headers.getSetCookie()
        assert.equal(cookies.length, 4)
        assert.deepEqual(cookies.map((cookie: string) => cookie.split('=')[0]).sort(),
          ['__Host-linea_oauth_state', '__Host-linea_oauth_verifier', '__Host-linea_oauth_nonce', '__Host-linea_oauth_return'].sort())
        for (const cookie of cookies) {
          assert.match(cookie, /=; Path=\/; Max-Age=0; HttpOnly; Secure; SameSite=Lax/)
          assert.doesNotMatch(cookie, /Domain=/i)
        }
        assert.ok(!cookies.some((cookie: string) => cookie.startsWith('__Host-linea_session=')))
        assert.equal(fetches, 0)
        assert.equal(dbAccesses, 0)
      }
    }
  } finally {
    globalThis.fetch = originalFetch
    if (originalEnv === undefined) delete globals.__oauthTestEnv
    else globals.__oauthTestEnv = originalEnv
  }
})

test('redirect URI resolver accepts only three exact HTTPS authorities and otherwise returns configured fallback', async () => {
  const app = await handlers()
  assert.equal(typeof app.resolveGoogleRedirectUri, 'function')
  for (const origin of origins) {
    assert.equal(app.resolveGoogleRedirectUri(`${origin}/api/auth/google/start?returnTo=/account`, fallback), `${origin}/api/auth/google/callback`)
    assert.equal(app.resolveGoogleRedirectUri(`${origin}/api/auth/google/callback?code=fixture`, fallback), `${origin}/api/auth/google/callback`)
  }
  for (const url of [
    'http://coloringpageflow.com/start', 'https://unknown.example/start',
    'https://coloringpageflow.com.evil.example/start', 'https://evilcoloringpageflow.com/start',
    'https://www.coloringpageflow.com.evil.example/start',
    'https://coloringpageflow.com:8443/start', 'https://coloringpageflow.com:443/start',
    'https://user:password@coloringpageflow.com/start', 'https://coloringpageflow.com@evil.example/start',
    'https://coloringpageflow.com./start', 'https://%63oloringpageflow.com/start',
    'https://coloringpageflow.com\\@evil.example/start', 'https://coloringpageflow.com\n.evil.example/start',
    '//coloringpageflow.com/start', 'not a URL',
  ]) {
    assert.equal(app.resolveGoogleRedirectUri(url, 'https://configured.example/callback'), 'https://configured.example/callback', url)
  }
})

test('OAuth start and callback share one explicit redirect URI resolver', async () => {
  for (const path of ['start', 'callback']) {
    const source = await readFile(`src/app/api/auth/google/${path}/route.ts`, 'utf8')
    assert.match(source, /resolveGoogleRedirectUri\(request\.url, env\.GOOGLE_REDIRECT_URI\)/)
  }
})
