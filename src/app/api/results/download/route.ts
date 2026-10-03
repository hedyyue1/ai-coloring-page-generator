import { apiError } from '@/lib/api-response'
import { requireSession } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'

const PAID = new Set(['active', 'paid', 'trialing'])

export async function POST(request: Request) {
  const env = await cloudflareEnv()
  const user = await requireSession(env, request)
  if (!user) return apiError('auth_required', 401, 'Sign in with Google to download a coloring page.')
  if (!user.subscription || !PAID.has(user.subscription.status)) return apiError('subscription_required', 403, 'An active paid subscription is required to download a coloring page.')
  let body: { preview_id?: unknown }
  try { body = await request.json() as { preview_id?: unknown } } catch { return apiError('invalid_request', 400, 'Invalid preview request.') }
  if (typeof body.preview_id !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.preview_id)) return apiError('invalid_preview', 400, 'Invalid preview request.')
  const object = await env.GENERATED_PREVIEWS.get(`generated/${body.preview_id}.png`)
  if (!object) return apiError('preview_expired', 410, 'This preview has expired. Generate it again to download.')
  const expires = object.customMetadata?.expires_at
  if (!expires || Date.parse(expires) <= Date.now()) return apiError('preview_expired', 410, 'This preview has expired. Generate it again to download.')
  return new Response(object.body, { headers: { 'content-type': 'image/png', 'content-disposition': 'attachment; filename="linea-coloring-page.png"', 'cache-control': 'no-store, private', 'x-robots-tag': 'noindex, nofollow, noarchive' } })
}
