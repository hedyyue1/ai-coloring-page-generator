import { apiError, apiJson } from '@/lib/api-response'
import { requireSession } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'
import { csrfToken } from '@/lib/request-security'

export async function GET(request: Request) {
  const env = await cloudflareEnv()
  if (!await requireSession(env, request)) return apiError('authentication_required', 401, 'Sign in to continue.')
  const token = await csrfToken(env, request)
  if (!token) return apiError('session_expired', 401, 'Sign in to continue.')
  return apiJson({ data: { csrf_token: token } })
}
