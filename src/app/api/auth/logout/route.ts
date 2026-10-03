import { apiJson } from '@/lib/api-response'
import { clearCookie, revokeSession, SESSION_COOKIE } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'

export async function POST(request: Request) {
  const env = await cloudflareEnv()
  await revokeSession(env, request)
  const response = apiJson({ ok: true })
  response.headers.append('set-cookie', clearCookie(SESSION_COOKIE))
  return response
}
