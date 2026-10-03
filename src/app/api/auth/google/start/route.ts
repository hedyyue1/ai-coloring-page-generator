import { buildGoogleAuthorizationUrl, resolveGoogleRedirectUri, safeReturnTo } from '@/lib/auth-core'
import { OAUTH_COOKIE_NAMES, randomToken, secureCookie, sha256Base64Url } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'
import { privateRedirect } from '@/lib/api-response'

export async function GET(request: Request) {
  const env = await cloudflareEnv()
  const redirectUri = resolveGoogleRedirectUri(request.url, env.GOOGLE_REDIRECT_URI)
  const loginUrl = new URL('/login', redirectUri)
  if (env.AUTH_ENABLED !== 'true' || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.AUTH_SECRET || !env.DB) {
    loginUrl.searchParams.set('error', 'oauth_not_configured')
    return privateRedirect(loginUrl.toString())
  }

  const input = new URL(request.url)
  const state = randomToken(24)
  const nonce = randomToken(24)
  const verifier = randomToken(48)
  const codeChallenge = await sha256Base64Url(verifier)
  const returnTo = safeReturnTo(input.searchParams.get('returnTo'))
  const location = buildGoogleAuthorizationUrl({
    clientId: env.GOOGLE_CLIENT_ID,
    redirectUri,
    state,
    nonce,
    codeChallenge,
  })
  const response = privateRedirect(location)
  response.headers.append('set-cookie', secureCookie(OAUTH_COOKIE_NAMES.state, state, 600))
  response.headers.append('set-cookie', secureCookie(OAUTH_COOKIE_NAMES.verifier, verifier, 600))
  response.headers.append('set-cookie', secureCookie(OAUTH_COOKIE_NAMES.nonce, nonce, 600))
  response.headers.append('set-cookie', secureCookie(OAUTH_COOKIE_NAMES.returnTo, returnTo, 600))
  return response
}
