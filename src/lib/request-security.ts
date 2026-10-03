import { apiError } from '@/lib/api-response'
import { readCookie, SESSION_COOKIE } from '@/lib/auth-server'

const encoder = new TextEncoder()

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))))
}

function sameOrigin(request: Request, siteUrl: string): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try { return new URL(origin).origin === new URL(siteUrl).origin } catch { return false }
}

function constantTimeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let result = 0
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return result === 0
}

export async function csrfToken(env: CloudflareEnv, request: Request): Promise<string | null> {
  const session = readCookie(request, SESSION_COOKIE)
  return session && env.AUTH_SECRET ? hmac(`csrf:${session}`, env.AUTH_SECRET) : null
}

export async function validateBrowserWrite(env: CloudflareEnv, request: Request): Promise<Response | null> {
  if (!sameOrigin(request, env.SITE_URL)) return apiError('origin_forbidden', 403, 'Request origin is not allowed.')
  const expected = await csrfToken(env, request)
  const supplied = request.headers.get('X-CSRF-Token') || ''
  if (!expected || !constantTimeEquals(expected, supplied)) return apiError('csrf_failed', 403, 'CSRF validation failed.')
  return null
}

export function idempotencyKey(request: Request): string | Response {
  const key = request.headers.get('Idempotency-Key') || ''
  if (!/^[\x21-\x7e]{16,128}$/.test(key)) return apiError('idempotency_key_required', 400, 'A valid Idempotency-Key is required.')
  return key
}

export async function requestHash(value: unknown): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(value))))
  return base64Url(bytes)
}

export async function idempotency(env: CloudflareEnv, userId: string, route: string, key: string, payload: unknown): Promise<Response | null> {
  const hash = await requestHash(payload)
  const prior = await env.DB.prepare('SELECT request_hash, response_json, response_status FROM idempotency_records WHERE user_id = ? AND route = ? AND key = ?')
    .bind(userId, route, key).first<{ request_hash: string; response_json: string | null; response_status: number | null }>()
  if (prior && prior.request_hash !== hash) return apiError('idempotency_key_reused', 409, 'Idempotency-Key was already used for a different request.')
  if (prior?.response_json && prior.response_status) return new Response(prior.response_json, { status: prior.response_status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store, private', 'x-robots-tag': 'noindex, nofollow, noarchive' } })
  if (!prior) await env.DB.prepare('INSERT INTO idempotency_records (user_id, route, key, request_hash, created_at) VALUES (?, ?, ?, ?, ?)').bind(userId, route, key, hash, new Date().toISOString()).run()
  return null
}

export async function rememberIdempotentResponse(env: CloudflareEnv, userId: string, route: string, key: string, response: Response): Promise<Response> {
  const body = await response.clone().text()
  await env.DB.prepare('UPDATE idempotency_records SET response_json = ?, response_status = ? WHERE user_id = ? AND route = ? AND key = ?')
    .bind(body, response.status, userId, route, key).run()
  return response
}

export function dualTestFlags(env: CloudflareEnv): boolean {
  return env.CREEM_MODE === 'test' && env.PAYMENTS_TEST_MODE === 'true'
}
