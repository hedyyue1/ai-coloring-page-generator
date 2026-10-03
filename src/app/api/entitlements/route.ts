import { apiError, apiJson } from '@/lib/api-response'
import { requireSession } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'

export async function GET(request: Request) {
  const env = await cloudflareEnv()
  const user = await requireSession(env, request)
  if (!user) return apiError('authentication_required', 401, 'Sign in to view entitlements.')
  const ledger = await env.DB.prepare('SELECT id, plan_id, event_type, delta, reference_id, created_at FROM entitlement_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').bind(user.id).all<Record<string, unknown>>()
  const available = ledger.results.reduce((total, row) => total + Number(row.delta || 0), 0)
  return apiJson({ data: { subscription: user.subscription, available_credits: available, ledger: ledger.results } })
}
