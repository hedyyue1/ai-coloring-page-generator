import { apiError, apiJson } from '@/lib/api-response'
import { requireSession } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const env = await cloudflareEnv()
  const user = await requireSession(env, request)
  if (!user) return apiError('authentication_required', 401, 'Sign in to continue.')
  const { jobId } = await params
  const job = await env.DB.prepare('SELECT id, mode, state, credit_state, error_code, created_at, updated_at FROM generation_jobs WHERE id = ? AND user_id = ?')
    .bind(jobId, user.id).first<Record<string, unknown>>()
  if (!job) return apiError('resource_not_found', 404, 'Generation was not found.')
  return apiJson({ data: { job: { id: String(job.id), mode: String(job.mode), state: String(job.state), credit_state: String(job.credit_state), error: job.error_code ? { code: String(job.error_code) } : null, created_at: String(job.created_at), updated_at: String(job.updated_at) } } })
}
