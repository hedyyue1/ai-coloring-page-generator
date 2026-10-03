import { apiError, apiJson } from '@/lib/api-response'
import { requireSession } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'
import { idempotency, idempotencyKey, rememberIdempotentResponse, validateBrowserWrite } from '@/lib/request-security'

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 10 * 1024 * 1024

export async function POST(request: Request) {
  const env = await cloudflareEnv()
  const user = await requireSession(env, request)
  if (!user) return apiError('authentication_required', 401, 'Sign in to continue.')
  const writeError = await validateBrowserWrite(env, request)
  if (writeError) return writeError
  const key = idempotencyKey(request)
  if (key instanceof Response) return key
  let body: { filename?: unknown; declared_mime?: unknown; bytes?: unknown; rights_confirmed?: unknown }
  try { body = await request.json() } catch { return apiError('invalid_json', 400, 'Request body must be valid JSON.') }
  const declaredMime = typeof body.declared_mime === 'string' ? body.declared_mime : ''
  const bytes = typeof body.bytes === 'number' ? body.bytes : 0
  const rightsConfirmed = body.rights_confirmed === true
  const replay = await idempotency(env, user.id, '/api/uploads/intents', key, { declared_mime: declaredMime, bytes, rights_confirmed: rightsConfirmed })
  if (replay) return replay
  if (!rightsConfirmed) return apiError('rights_confirmation_required', 403, 'Confirm that you have rights to use this image.')
  if (!ALLOWED_MIMES.has(declaredMime)) return apiError('unsupported_media_type', 415, 'Use PNG, JPEG, or WebP.')
  if (!Number.isInteger(bytes) || bytes < 1 || bytes > MAX_BYTES) return apiError('upload_too_large', 413, 'The image must be 10 MiB or smaller.')
  if (!env.GENERATED_PREVIEWS) return apiError('service_not_configured', 503, 'Private upload storage is not configured.')
  const id = `upl_${crypto.randomUUID()}`
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString()
  await env.DB.prepare('INSERT INTO upload_intents (id, user_id, object_key, declared_mime, declared_bytes, rights_confirmed, state, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, \'pending\', ?, ?, ?)')
    .bind(id, user.id, `uploads/${id}`, declaredMime, bytes, expiresAt, now.toISOString(), now.toISOString()).run()
  return rememberIdempotentResponse(env, user.id, '/api/uploads/intents', key, apiJson({ data: { upload_id: id, upload_path: `/api/uploads/${id}`, expires_at: expiresAt } }, 201))
}
