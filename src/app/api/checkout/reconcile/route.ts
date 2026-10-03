import { apiError, apiJson } from '@/lib/api-response'
import { requireSession } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'
import { validateBrowserWrite } from '@/lib/request-security'
import { reconcileWaffoPayments } from '@/lib/waffo-reconcile'

export async function POST(request: Request) {
  const env = await cloudflareEnv()
  const user = await requireSession(env, request)
  if (!user) return apiError('authentication_required', 401, 'Sign in to continue.')
  const writeError = await validateBrowserWrite(env, request)
  if (writeError) return writeError
  try {
    // Only server-side current-user intents; browser order/plan/success values
    // are intentionally ignored. This is audited provider-read recovery.
    return apiJson(await reconcileWaffoPayments(env, user.id))
  } catch {
    return apiError('payment_reconciliation_unavailable', 503, 'Payment confirmation is temporarily unavailable. No payment should be repeated.')
  }
}
