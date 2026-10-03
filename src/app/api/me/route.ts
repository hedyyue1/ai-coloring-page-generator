import { apiJson } from '@/lib/api-response'
import { requireSession } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'

type CreditLedgerRow = {
  id: string
  plan_id: string
  event_type: string
  delta: number
  reference_id: string
  created_at: string
}

export async function GET(request: Request) {
  const env = await cloudflareEnv()
  const user = await requireSession(env, request)
  if (!user) return apiJson({ user: null, creditLedger: [] })

  const ledgerResult = await env.DB.prepare(`
    SELECT id, plan_id, event_type, delta, reference_id, created_at
    FROM entitlement_ledger
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).bind(user.id).all<CreditLedgerRow>()

  const creditLedger = (ledgerResult.results || []).map((row) => ({
    id: row.id,
    planId: row.plan_id,
    eventType: row.event_type,
    delta: Number(row.delta),
    referenceId: row.reference_id,
    createdAt: row.created_at,
  }))

  return apiJson({ user, creditLedger })
}
