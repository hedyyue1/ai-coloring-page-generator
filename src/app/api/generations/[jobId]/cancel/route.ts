import { apiError, apiJson } from '@/lib/api-response'
import { requireSession } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'
import { idempotency, idempotencyKey, rememberIdempotentResponse, validateBrowserWrite } from '@/lib/request-security'

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const env = await cloudflareEnv()
  const user = await requireSession(env, request)
  if (!user) return apiError('authentication_required', 401, 'Sign in to continue.')
  const writeError = await validateBrowserWrite(env, request)
  if (writeError) return writeError
  const key = idempotencyKey(request)
  if (key instanceof Response) return key
  const { jobId } = await params
  const replay = await idempotency(env, user.id, `/api/generations/${jobId}/cancel`, key, {})
  if (replay) return replay
  const job = await env.DB.prepare('SELECT state, credit_state FROM generation_jobs WHERE id = ? AND user_id = ?').bind(jobId, user.id).first<{ state: string; credit_state: string }>()
  if (!job) return apiError('resource_not_found', 404, 'Generation was not found.')
  if (!['pending', 'queued'].includes(job.state)) return apiError('job_not_cancellable', 409, 'This generation can no longer be cancelled.')
  const now = new Date().toISOString()
  const statements = [env.DB.prepare('UPDATE generation_jobs SET state = \'cancelled\', credit_state = \'released\', updated_at = ? WHERE id = ? AND user_id = ?').bind(now, jobId, user.id)]
  if (job.credit_state === 'reserved') statements.push(env.DB.prepare('INSERT OR IGNORE INTO entitlement_ledger (id, user_id, plan_id, event_type, delta, idempotency_key, reference_id, created_at) VALUES (?, ?, \'generation\', \'release\', 1, ?, ?, ?)').bind(`led_${crypto.randomUUID()}`, user.id, `release:${jobId}`, jobId, now))
  await env.DB.batch(statements)
  return rememberIdempotentResponse(env, user.id, `/api/generations/${jobId}/cancel`, key, apiJson({ data: { job: { id: jobId, state: 'cancelled', credit_state: 'released' } } }))
}
