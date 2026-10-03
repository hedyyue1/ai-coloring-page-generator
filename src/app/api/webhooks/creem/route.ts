import { apiError, apiJson } from '@/lib/api-response'
import { cloudflareEnv } from '@/lib/cloudflare'
import { catalogPlan, classifyCreemEvent, extractCreemContext, verifyCreemSignature } from '@/lib/creem-core'
import { dualTestFlags } from '@/lib/request-security'

// Explicit reference set for review: only successful paid lifecycle events can grant.
const REVIEWED_EVENTS = [
  'checkout.completed', 'subscription.active', 'subscription.paid', 'subscription.canceled',
  'subscription.expired', 'subscription.paused', 'subscription.trialing',
  'subscription.scheduled_cancel', 'subscription.past_due', 'subscription.update',
  'refund.created', 'dispute.created',
]
void REVIEWED_EVENTS

async function bodyHash(rawBody: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawBody)))
  return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('')
}

async function finishEvent(env: CloudflareEnv, eventId: string, errorCode: string | null = null) {
  await env.DB.prepare("UPDATE creem_webhook_events SET processing_state = 'processed', error_code = ?, processed_at = ? WHERE event_id = ?")
    .bind(errorCode, new Date().toISOString(), eventId).run()
}

async function failEvent(env: CloudflareEnv, eventId: string) {
  await env.DB.prepare("UPDATE creem_webhook_events SET processing_state = 'failed', error_code = 'processing_failed' WHERE event_id = ?")
    .bind(eventId).run()
}

export async function POST(request: Request) {
  const env = await cloudflareEnv()
  if (!dualTestFlags(env) || !env.CREEM_WEBHOOK_SECRET) return apiError('creem_webhook_secret_not_configured', 503, 'Creem Test webhook is not configured.')
  const rawBody = await request.text()
  const signature = request.headers.get('creem-signature') || ''
  if (!(await verifyCreemSignature(rawBody, env.CREEM_WEBHOOK_SECRET, signature))) {
    return apiError('webhook_signature_invalid', 401, 'Webhook signature was rejected.')
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return apiError('invalid_webhook_json', 400, 'Webhook body must be valid JSON.')
  }
  const context = extractCreemContext(payload)
  if (!context.eventId || !context.eventType) return apiError('invalid_webhook_event', 400, 'Webhook event is missing an ID or type.')

  const now = new Date().toISOString()
  const payloadHash = await bodyHash(rawBody)
  await env.DB.prepare(`INSERT OR IGNORE INTO creem_webhook_events
    (event_id, event_type, payload_hash, processing_state, received_at) VALUES (?, ?, ?, 'received', ?)`)
    .bind(context.eventId, context.eventType, payloadHash, now).run()
  const receipt = await env.DB.prepare('SELECT processing_state, payload_hash FROM creem_webhook_events WHERE event_id = ?')
    .bind(context.eventId).first<{ processing_state: string; payload_hash: string }>()
  if (!receipt || receipt.payload_hash !== payloadHash) return apiError('webhook_event_conflict', 409, 'Webhook event ID conflicts with an existing payload.')
  if (receipt.processing_state === 'processed') return apiJson({ ok: true, duplicate: true })

  const staleBefore = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const claim = await env.DB.prepare(`UPDATE creem_webhook_events
    SET processing_state = 'processing', attempt_count = attempt_count + 1, claimed_at = ?, error_code = NULL
    WHERE event_id = ? AND (
      processing_state IN ('received', 'failed') OR
      (processing_state = 'processing' AND claimed_at < ?)
    )`).bind(now, context.eventId, staleBefore).run()
  if (!claim.meta.changes) return apiError('webhook_event_busy', 409, 'Webhook event is already being processed.', true)

  try {
    return await processClaimedEvent(env, context, now)
  } catch {
    await failEvent(env, context.eventId)
    return apiError('webhook_processing_failed', 500, 'Webhook processing failed.', true)
  }
}

async function processClaimedEvent(env: CloudflareEnv, context: ReturnType<typeof extractCreemContext>, now: string) {
  const action = classifyCreemEvent(context.eventType)
  if (action === 'ignore') {
    await finishEvent(env, context.eventId, 'ignored_event_type')
    return apiJson({ ok: true, ignored: true })
  }

  if (action === 'state_only') {
    await finishEvent(env, context.eventId, 'state_change_requires_reconciliation')
    return apiJson({ ok: true, entitlement_granted: false, reconciliation_required: true })
  }

  if (action === 'deactivate') {
    if (!context.subscriptionId) {
      await finishEvent(env, context.eventId, 'webhook_mapping_mismatch')
      return apiJson({ ok: true, ignored: true })
    }
    const existing = await env.DB.prepare('SELECT product_id FROM subscriptions WHERE creem_subscription_id = ?')
      .bind(context.subscriptionId).first<{ product_id: string }>()
    if (!existing || (context.productId && context.productId !== existing.product_id)) {
      await finishEvent(env, context.eventId, 'webhook_mapping_mismatch')
      return apiJson({ ok: true, ignored: true })
    }
    const status = context.eventType.replace('subscription.', '')
    await env.DB.batch([
      env.DB.prepare('UPDATE subscriptions SET status = ?, updated_at = ? WHERE creem_subscription_id = ?').bind(status, now, context.subscriptionId),
      env.DB.prepare("UPDATE creem_webhook_events SET processing_state = 'processed', processed_at = ? WHERE event_id = ?").bind(now, context.eventId),
    ])
    return apiJson({ ok: true })
  }

  const plan = catalogPlan(context.planId)
  const configuredProduct = plan ? env[plan.productBinding] : null
  const intent = context.requestId ? await env.DB.prepare(`SELECT user_id, plan_id, product_id, expected_amount_cents, expected_currency
    FROM checkout_intents WHERE request_id = ? AND mode = 'test'`).bind(context.requestId).first<{
      user_id: string; plan_id: string; product_id: string; expected_amount_cents: number; expected_currency: string
    }>() : null
  const mappingMatches = Boolean(
    plan && configuredProduct && intent &&
    context.userId === intent.user_id && context.planId === intent.plan_id &&
    context.productId === configuredProduct && intent.product_id === configuredProduct &&
    context.amountCents === intent.expected_amount_cents && context.currency === intent.expected_currency,
  )
  if (!mappingMatches || !plan || !intent || !configuredProduct) {
    await finishEvent(env, context.eventId, 'webhook_mapping_mismatch')
    return apiJson({ ok: true, ignored: true })
  }

  if (action === 'record_only') {
    await env.DB.batch([
      env.DB.prepare("UPDATE checkout_intents SET state = 'checkout_completed', creem_order_id = ?, updated_at = ? WHERE request_id = ?")
        .bind(context.orderId || null, now, context.requestId),
      env.DB.prepare("UPDATE creem_webhook_events SET processing_state = 'processed', processed_at = ? WHERE event_id = ?").bind(now, context.eventId),
    ])
    return apiJson({ ok: true, entitlement_granted: false })
  }

  if (!context.subscriptionId || !context.periodStart || !context.periodEnd) {
    await finishEvent(env, context.eventId, 'webhook_mapping_mismatch')
    return apiJson({ ok: true, ignored: true })
  }

  const subscriptionId = `sub_${crypto.randomUUID()}`
  const cycleId = `cyc_${crypto.randomUUID()}`
  const ledgerId = `led_${crypto.randomUUID()}`
  const idempotencyKey = `creem-cycle:${context.subscriptionId}:${context.periodStart}:${context.periodEnd}`
  const status = context.eventType.replace('subscription.', '')
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO subscriptions
      (id, creem_subscription_id, creem_order_id, user_id, plan_id, product_id, status, period_start, period_end, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(creem_subscription_id) DO UPDATE SET creem_order_id = excluded.creem_order_id, status = excluded.status,
        period_start = excluded.period_start, period_end = excluded.period_end, updated_at = excluded.updated_at`)
      .bind(subscriptionId, context.subscriptionId, context.orderId || null, intent.user_id, plan.id, configuredProduct, status, context.periodStart, context.periodEnd, now),
    env.DB.prepare(`INSERT OR IGNORE INTO billing_cycles
      (id, creem_subscription_id, user_id, plan_id, period_start, period_end, credits_granted, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(cycleId, context.subscriptionId, intent.user_id, plan.id, context.periodStart, context.periodEnd, plan.monthlyCredits, now),
    env.DB.prepare(`INSERT OR IGNORE INTO entitlement_ledger
      (id, user_id, plan_id, event_type, delta, idempotency_key, reference_id, created_at)
      VALUES (?, ?, ?, 'grant', ?, ?, ?, ?)`)
      .bind(ledgerId, intent.user_id, plan.id, plan.monthlyCredits, idempotencyKey, context.subscriptionId, now),
    env.DB.prepare("UPDATE checkout_intents SET state = 'subscription_active', creem_order_id = ?, updated_at = ? WHERE request_id = ?")
      .bind(context.orderId || null, now, context.requestId),
    env.DB.prepare("UPDATE creem_webhook_events SET processing_state = 'processed', processed_at = ? WHERE event_id = ?")
      .bind(now, context.eventId),
  ])
  return apiJson({ ok: true, entitlement_granted: true })
}
