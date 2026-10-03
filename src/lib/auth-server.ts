import { googleIdentityProfile } from '@/lib/auth-core'

export const SESSION_COOKIE = '__Host-linea_session'
export const OAUTH_COOKIE_NAMES = {
  state: '__Host-linea_oauth_state',
  verifier: '__Host-linea_oauth_verifier',
  nonce: '__Host-linea_oauth_nonce',
  returnTo: '__Host-linea_oauth_return',
} as const

export type SessionUser = {
  id: string
  email: string | null
  displayName: string | null
  createdAt: string
  subscription: { planId: string; status: string; periodEnd: string | null } | null
  availableCredits: number
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function randomToken(bytes = 32): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)))
}

export async function sha256Base64Url(value: string): Promise<string> {
  return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
}

async function sessionHash(token: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(token))))
}

export function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('cookie') || ''
  for (const part of cookie.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

export function secureCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`
}

export function clearCookie(name: string): string {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
}

export function clearOAuthCookies(headers: Headers): void {
  for (const name of Object.values(OAUTH_COOKIE_NAMES)) headers.append('set-cookie', clearCookie(name))
}

export async function createSession(env: CloudflareEnv, userId: string): Promise<string> {
  if (!env.AUTH_SECRET) throw new Error('auth_not_configured')
  const token = randomToken(32)
  const hash = await sessionHash(token, env.AUTH_SECRET)
  const now = new Date()
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  await env.DB.prepare('INSERT INTO sessions (session_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(hash, userId, now.toISOString(), expires.toISOString()).run()
  return token
}

export async function upsertGoogleUser(env: CloudflareEnv, claims: Record<string, unknown>): Promise<string> {
  const issuer = String(claims.iss)
  const subject = String(claims.sub)
  const existing = await env.DB.prepare('SELECT user_id FROM auth_identities WHERE issuer = ? AND subject = ?')
    .bind(issuer, subject).first<{ user_id: string }>()
  const now = new Date().toISOString()
  const profile = googleIdentityProfile(claims)
  if (existing) {
    await env.DB.prepare('UPDATE users SET email = ?, display_name = ?, updated_at = ? WHERE id = ?')
      .bind(profile.email, profile.displayName, now, existing.user_id).run()
    return existing.user_id
  }
  const userId = `usr_${crypto.randomUUID()}`
  await env.DB.batch([
    env.DB.prepare('INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .bind(userId, profile.email, profile.displayName, now, now),
    env.DB.prepare('INSERT INTO auth_identities (id, user_id, issuer, subject, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(`idn_${crypto.randomUUID()}`, userId, issuer, subject, profile.emailVerified ? 1 : 0, now, now),
  ])
  return userId
}

export async function requireSession(env: CloudflareEnv, request: Request): Promise<SessionUser | null> {
  if (!env.AUTH_SECRET) return null
  const token = readCookie(request, SESSION_COOKIE)
  if (!token) return null
  const hash = await sessionHash(token, env.AUTH_SECRET)
  const row = await env.DB.prepare(`
    SELECT u.id, u.email, u.display_name, u.created_at,
      s2.plan_id, s2.status AS subscription_status, s2.period_end,
      COALESCE((SELECT SUM(delta) FROM entitlement_ledger e WHERE e.user_id = u.id), 0) AS available_credits
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN (
      SELECT user_id, plan_id, status, period_end, updated_at
      FROM subscriptions WHERE status IN ('active', 'trialing', 'paid')
      UNION ALL
      SELECT user_id, plan_id, 'active' AS status, period_end, updated_at
      FROM waffo_subscriptions
      WHERE status IN ('active', 'canceling') AND period_start <= ? AND period_end > ?
        AND EXISTS (SELECT 1 FROM waffo_billing_cycles c
          WHERE c.order_id = waffo_subscriptions.order_id
            AND c.user_id = waffo_subscriptions.user_id
            AND c.plan_id = waffo_subscriptions.plan_id
            AND c.period_start = waffo_subscriptions.period_start
            AND c.period_end = waffo_subscriptions.period_end)
    ) s2 ON s2.user_id = u.id
    WHERE s.session_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?
    ORDER BY s2.updated_at DESC LIMIT 1
  `).bind(new Date().toISOString(), new Date().toISOString(), hash, new Date().toISOString()).first<Record<string, unknown>>()
  if (!row) return null
  return {
    id: String(row.id),
    email: typeof row.email === 'string' ? row.email : null,
    displayName: typeof row.display_name === 'string' ? row.display_name : null,
    createdAt: String(row.created_at),
    availableCredits: Number(row.available_credits || 0),
    subscription: row.plan_id ? {
      planId: String(row.plan_id),
      status: String(row.subscription_status),
      periodEnd: typeof row.period_end === 'string' ? row.period_end : null,
    } : null,
  }
}

export async function revokeSession(env: CloudflareEnv, request: Request): Promise<void> {
  if (!env.AUTH_SECRET) return
  const token = readCookie(request, SESSION_COOKIE)
  if (!token) return
  const hash = await sessionHash(token, env.AUTH_SECRET)
  await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE session_hash = ?').bind(new Date().toISOString(), hash).run()
}
