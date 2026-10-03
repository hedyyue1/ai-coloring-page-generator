import { createWaffoCheckout } from '@/lib/waffo-payment'
import { waffoProductBinding } from '@/lib/waffo-core'
import { apiError, apiJson } from '@/lib/api-response'
import { requireSession } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'
import { catalogPlan, creemApiBase, isAllowedCreemCheckoutUrl } from '@/lib/creem-core'
import { dualTestFlags, idempotency, idempotencyKey, rememberIdempotentResponse, validateBrowserWrite } from '@/lib/request-security'

export async function POST(request: Request) {
  const env = await cloudflareEnv()
  const user = await requireSession(env, request)
  if (!user) return apiError('authentication_required', 401, 'Sign in with Google before starting checkout.')
  const writeError = await validateBrowserWrite(env, request)
  if (writeError) return writeError
  const key = idempotencyKey(request)
  if (key instanceof Response) return key
  const useWaffo = Boolean(env.WAFFO_MODE)
  const testMode = useWaffo ? env.WAFFO_MODE === 'test' && env.PAYMENTS_TEST_MODE === 'true' : dualTestFlags(env)
  if (env.PAYMENTS_ENABLED !== 'true' || !testMode) return apiError('payments_disabled', 503, 'Test checkout is not enabled.')
  if (useWaffo ? !(env.WAFFO_MERCHANT_ID && env.WAFFO_PRIVATE_KEY_TEST && env.WAFFO_STORE_ID_TEST) : !env.CREEM_API_KEY) return apiError('checkout_not_configured', 503, 'Test checkout is not configured.')

  let body: { plan_id?: unknown }
  try {
    body = await request.json() as { plan_id?: unknown }
  } catch {
    return apiError('invalid_request', 400, 'Request body must be valid JSON.')
  }
  const planId = typeof body.plan_id === 'string' ? body.plan_id : ''
  const replay = await idempotency(env, user.id, '/api/checkout', key, { plan_id: planId })
  if (replay) return replay
  const plan = catalogPlan(planId)
  if (!plan) return apiError('plan_not_available', 400, 'Choose an available paid monthly plan.')

  // The binding name is selected only from the fixed CREEM_PRODUCT_* catalog.
  const productId = useWaffo ? env[waffoProductBinding(plan.id)] : env[plan.productBinding]
  const apiBase = creemApiBase(env.CREEM_MODE)
  if (!productId || (!useWaffo && !apiBase)) return apiError('checkout_not_configured', 503, 'This Test product is not configured.')

  const requestId = `req_${crypto.randomUUID()}`
  const intentId = `chk_${crypto.randomUUID()}`
  const now = new Date().toISOString()
  await env.DB.prepare(`INSERT INTO checkout_intents
    (id, request_id, user_id, plan_id, product_id, expected_amount_cents, expected_currency, mode, state, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'test', 'creating', ?, ?)`)
    .bind(intentId, requestId, user.id, plan.id, productId, plan.amountCents, plan.currency, now, now).run()

  if (useWaffo) {
    try {
      const provider = await createWaffoCheckout(env, user, plan.id, requestId, intentId)
      return rememberIdempotentResponse(env, user.id, '/api/checkout', key, apiJson({ data: { checkout_url: provider.checkoutUrl, checkout_intent_id: intentId, status: 'pending' }, request_id: requestId }))
    } catch {
      await env.DB.prepare("UPDATE checkout_intents SET state = 'create_failed', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), intentId).run()
      return apiError('checkout_provider_error', 502, 'Waffo Test checkout could not be created.', true)
    }
  }

  const providerResponse = await fetch(`${apiBase}/checkouts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', 'x-api-key': env.CREEM_API_KEY! },
    body: JSON.stringify({
      product_id: productId,
      request_id: requestId,
      success_url: `${env.SITE_URL}/checkout/pending?request_id=${encodeURIComponent(requestId)}`,
      metadata: { user_id: user.id, plan_id: plan.id, request_id: requestId },
    }),
  })
  if (!providerResponse.ok) {
    await env.DB.prepare("UPDATE checkout_intents SET state = 'create_failed', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), intentId).run()
    return apiError('checkout_provider_error', 502, 'Creem Test checkout could not be created.', true)
  }
  const provider = await providerResponse.json() as { id?: string; checkout_url?: string; url?: string }
  const checkoutUrl = provider.checkout_url || provider.url
  if (!checkoutUrl || !isAllowedCreemCheckoutUrl(checkoutUrl)) {
    await env.DB.prepare("UPDATE checkout_intents SET state = 'invalid_provider_response', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), intentId).run()
    return apiError('checkout_provider_error', 502, 'Creem returned an invalid checkout response.')
  }
  await env.DB.prepare("UPDATE checkout_intents SET state = 'pending', creem_checkout_id = ?, updated_at = ? WHERE id = ?")
    .bind(provider.id || null, new Date().toISOString(), intentId).run()
  return rememberIdempotentResponse(env, user.id, '/api/checkout', key, apiJson({ data: { checkout_url: checkoutUrl, checkout_intent_id: intentId, status: 'pending' }, request_id: requestId }))
}
