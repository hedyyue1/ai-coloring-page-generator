import { apiError, apiJson } from '@/lib/api-response'
import { requireSession } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'
import { idempotency, idempotencyKey, rememberIdempotentResponse, validateBrowserWrite } from '@/lib/request-security'

export async function POST(request: Request) {
  const env = await cloudflareEnv()
  const user = await requireSession(env, request)
  if (!user) return apiError('authentication_required', 401, 'Sign in to continue.')
  const writeError = await validateBrowserWrite(env, request)
  if (writeError) return writeError
  const key = idempotencyKey(request)
  if (key instanceof Response) return key
  if (String(env.GENERATION_ENABLED) !== ('true' as string) || String(env.GENERATION_TEST_MODE) !== ('true' as string) || String(env.CREEM_MODE) !== ('test' as string)) return apiError('generation_disabled', 503, 'Generation is not enabled in this Test environment.')
  let body: { mode?: unknown; upload_id?: unknown; rights_confirmed?: unknown }
  try { body = await request.json() } catch { return apiError('invalid_json', 400, 'Request body must be valid JSON.') }
  const mode = body.mode === 'photo' ? 'photo' : ''
  const uploadId = typeof body.upload_id === 'string' ? body.upload_id : ''
  const replay = await idempotency(env, user.id, '/api/generations', key, { mode, upload_id: uploadId, rights_confirmed: body.rights_confirmed === true })
  if (replay) return replay
  if (mode !== 'photo' || !uploadId || body.rights_confirmed !== true) return apiError('invalid_request', 400, 'Use a confirmed uploaded photo.')
  const asset = await env.DB.prepare('SELECT id FROM assets WHERE upload_id = ? AND user_id = ? AND purpose = \'input\' AND state = \'ready\'').bind(uploadId, user.id).first<{ id: string }>()
  if (!asset) return apiError('resource_not_found', 404, 'Uploaded image was not found.')
  const balance = await env.DB.prepare('SELECT COALESCE(SUM(delta), 0) AS credits FROM entitlement_ledger WHERE user_id = ?').bind(user.id).first<{ credits: number }>()
  if (!balance || Number(balance.credits) < 1) return apiError('credit_insufficient', 409, 'No generation credits are available.')
  const id = `job_${crypto.randomUUID()}`
  const now = new Date().toISOString()
  await env.DB.batch([
    env.DB.prepare('INSERT INTO generation_jobs (id, user_id, idempotency_key, mode, input_asset_id, state, credit_state, created_at, updated_at) VALUES (?, ?, ?, \'photo\', ?, \'queued\', \'reserved\', ?, ?)').bind(id, user.id, key, asset.id, now, now),
    env.DB.prepare('INSERT INTO entitlement_ledger (id, user_id, plan_id, event_type, delta, idempotency_key, reference_id, created_at) VALUES (?, ?, \'generation\', \'reserve\', -1, ?, ?, ?)').bind(`led_${crypto.randomUUID()}`, user.id, `reserve:${id}`, id, now),
  ])
  return rememberIdempotentResponse(env, user.id, '/api/generations', key, apiJson({ data: { job: { id, state: 'queued', credit_state: 'reserved', created_at: now } } }, 202))
}
