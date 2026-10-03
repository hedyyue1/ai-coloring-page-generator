export type GoogleOidcClaims = Record<string, unknown>

// Owner-approved project origins only. Never derive trust from Host/forwarded
// headers or accept an arbitrary request origin as a Google callback.
const GOOGLE_OAUTH_ORIGINS = new Set([
  'https://ai-coloring-page-generator.hedyyue1.workers.dev',
  'https://coloringpageflow.com',
  'https://www.coloringpageflow.com',
])

export function resolveGoogleRedirectUri(requestUrl: string, configuredRedirectUri: string): string {
  // Check the raw authority before WHATWG normalization can erase credentials,
  // explicit default ports, escaped host bytes or control characters.
  if (/[\\\x00-\x20\x7f]/.test(requestUrl)) return configuredRedirectUri
  const authority = /^https:\/\/([^/?#]+)(?:[/?#]|$)/.exec(requestUrl)
  if (!authority) return configuredRedirectUri
  const origin = `https://${authority[1]}`
  if (!GOOGLE_OAUTH_ORIGINS.has(origin)) return configuredRedirectUri
  try {
    const url = new URL(requestUrl)
    if (url.origin !== origin || url.username || url.password || url.port) return configuredRedirectUri
    return `${origin}/api/auth/google/callback`
  } catch {
    return configuredRedirectUri
  }
}

export function googleIdentityProfile(claims: GoogleOidcClaims): {
  email: string | null
  displayName: string | null
  emailVerified: boolean
} {
  const emailVerified = claims.email_verified === true || claims.email_verified === 'true'
  return {
    email: emailVerified && typeof claims.email === 'string' ? claims.email : null,
    displayName: typeof claims.name === 'string' ? claims.name : null,
    emailVerified,
  }
}

export function safeReturnTo(value: string | null | undefined): string {
  if (!value) return '/account'
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x1f\x7f]/.test(value)) return '/'
  try {
    const base = 'https://return-to.invalid'
    const url = new URL(value, base)
    if (url.origin !== base) return '/'
    // Reject ambiguous separators before a router can decode them again.
    if (url.pathname.startsWith('//') || /%2f|%5c/i.test(url.pathname)) return '/'
    if (/^\/(api|webhooks)(\/|$)/.test(url.pathname)) return '/'
    return url.pathname + url.search + url.hash
  } catch {
    return '/'
  }
}

export function buildGoogleAuthorizationUrl(input: {
  clientId: string
  redirectUri: string
  state: string
  nonce: string
  codeChallenge: string
}): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.search = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: input.state,
    nonce: input.nonce,
    code_challenge: input.codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString()
  return url.toString()
}

function stringClaim(claims: GoogleOidcClaims, key: string): string {
  const value = claims[key]
  return typeof value === 'string' ? value : ''
}

export function isGoogleOidcClaimsValid(
  claims: GoogleOidcClaims,
  expectedAudience: string,
  expectedNonce: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const issuer = stringClaim(claims, 'iss')
  const audience = stringClaim(claims, 'aud')
  const subject = stringClaim(claims, 'sub')
  const nonce = stringClaim(claims, 'nonce')
  const expiry = Number(stringClaim(claims, 'exp'))
  return (
    (issuer === 'https://accounts.google.com' || issuer === 'accounts.google.com') &&
    audience === expectedAudience &&
    subject.length > 0 &&
    nonce === expectedNonce &&
    Number.isFinite(expiry) &&
    expiry > nowSeconds
  )
}
