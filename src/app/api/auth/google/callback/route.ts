import { isGoogleOidcClaimsValid, resolveGoogleRedirectUri, safeReturnTo } from '@/lib/auth-core'
import {
  clearOAuthCookies,
  createSession,
  OAUTH_COOKIE_NAMES,
  readCookie,
  secureCookie,
  SESSION_COOKIE,
  upsertGoogleUser,
} from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'
import { privateRedirect } from '@/lib/api-response'

function fail(redirectUri: string, code: string) {
  const url = new URL('/login', redirectUri)
  url.searchParams.set('error', code)
  const response = privateRedirect(url.toString())
  clearOAuthCookies(response.headers)
  return response
}

export async function GET(request: Request) {
  const env = await cloudflareEnv()
  const redirectUri = resolveGoogleRedirectUri(request.url, env.GOOGLE_REDIRECT_URI)
  if (env.AUTH_ENABLED !== 'true' || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.AUTH_SECRET || !env.DB) return fail(redirectUri, 'oauth_not_configured')
  const url = new URL(request.url)
  if (url.searchParams.get('error')) return fail(redirectUri, 'sign_in_cancelled')
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const expectedState = readCookie(request, OAUTH_COOKIE_NAMES.state)
  const verifier = readCookie(request, OAUTH_COOKIE_NAMES.verifier)
  const expectedNonce = readCookie(request, OAUTH_COOKIE_NAMES.nonce)
  const returnTo = safeReturnTo(readCookie(request, OAUTH_COOKIE_NAMES.returnTo))
  if (!code || !state || !expectedState || state !== expectedState || !verifier || !expectedNonce) return fail(redirectUri, 'invalid_oauth_state')

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
    })
    if (!tokenResponse.ok) return fail(redirectUri, 'sign_in_failed')
    const token = await tokenResponse.json() as { id_token?: string }
    if (!token.id_token) return fail(redirectUri, 'sign_in_failed')

    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token.id_token)}`, {
      headers: { accept: 'application/json' },
    })
    if (!verifyResponse.ok) return fail(redirectUri, 'sign_in_failed')
    const claims = await verifyResponse.json() as Record<string, unknown>
    if (!isGoogleOidcClaimsValid(claims, env.GOOGLE_CLIENT_ID, expectedNonce)) return fail(redirectUri, 'sign_in_failed')

    const userId = await upsertGoogleUser(env, claims)
    const session = await createSession(env, userId)
    const response = privateRedirect(new URL(returnTo, redirectUri).toString())
    response.headers.append('set-cookie', secureCookie(SESSION_COOKIE, session, 30 * 24 * 60 * 60))
    clearOAuthCookies(response.headers)
    return response
  } catch {
    return fail(redirectUri, 'sign_in_failed')
  }
}
