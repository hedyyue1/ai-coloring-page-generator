import { catalogPlan } from './creem-core'
import { decimalCents, waffoProductBinding } from './waffo-core'
import { waffoClient } from './waffo-payment'

export type ReconciliationClient = { graphql: { query(params: { query: string; variables: Record<string, unknown> }): Promise<unknown> } }
type Intent = { id: string; request_id: string; user_id: string; plan_id: string; product_id: string; expected_amount_cents: number; expected_currency: string; order_id: string | null }
// Official SDK 0.25 GraphQL guide: payments.refunds; official Orders & Payments
// docs: external reference filter and channel-provided periodNumber. Identity is
// the checkout buyerIdentity wire field (SDK changelog/webhook field reference).
// Selecting it also validates server schema: absent/unsupported is NEVER bypassed.
export const RECONCILIATION_QUERY = `query($storeId: String!, $ref: String!) {
 subscriptionOrders(storeId: $storeId, filter: { orderMerchantExternalId: { eq: $ref } }, limit: 2) {
  id testMode orderMerchantExternalId merchantProvidedBuyerIdentity status billingPeriod
  currentPeriodStart currentPeriodEnd currentPeriodNumber
  subscriptionProduct { id }
  priceSnapshot { currency regularPhase { subtotal } }
  payments { id status periodNumber snapshotAmountDetails { currency subtotal } refunds { id status } }
 }
}`
function record(value: unknown): Record<string, unknown> {
 return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function period(value: unknown): string | null {
 if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) || !Number.isFinite(Date.parse(value))) return null
 return new Date(value).toISOString()
}

/** Narrow missing-subscription recovery, NOT a general lifecycle reconciler.
 * Never overwrites ANY existing subscription, including canceled/newer state.
 * Browser order IDs, plan/price fields and success flags are not accepted.
 */
export async function reconcileWaffoPayments(env: CloudflareEnv, userId: string, injectedClient?: ReconciliationClient, now = new Date()): Promise<{ reconciled: number; checked: number }> {
 if (env.WAFFO_MODE !== 'test' || env.PAYMENTS_TEST_MODE !== 'true' || env.PAYMENTS_ENABLED !== 'true' || !env.WAFFO_STORE_ID_TEST) throw new Error('reconciliation_disabled')
 const observed = now.toISOString()
 const intents = await env.DB.prepare(`SELECT i.*,l.order_id FROM checkout_intents i JOIN waffo_checkout_links l ON l.intent_id=i.id
  WHERE i.user_id=? AND i.mode='test' AND i.state='pending' AND l.store_id=?
  ORDER BY i.created_at DESC,i.id DESC LIMIT 3`).bind(userId,env.WAFFO_STORE_ID_TEST).all<Intent>()
 let checked = 0
 for (const intent of intents.results) {
  const plan = catalogPlan(intent.plan_id)
  const product = plan && env[waffoProductBinding(plan.id)]
  if (!plan || !product || intent.user_id !== userId || intent.product_id !== product || intent.expected_amount_cents !== plan.amountCents || intent.expected_currency !== plan.currency) continue
  const client = injectedClient || { graphql: { query: (params: {query:string;variables:Record<string,unknown>}) => waffoClient(env).graphql.query(params) } }
  checked++
  const response = record(await client.graphql.query({query:RECONCILIATION_QUERY,variables:{storeId:env.WAFFO_STORE_ID_TEST,ref:intent.request_id}}))
  if (response.errors != null && (!Array.isArray(response.errors) || response.errors.length)) throw new Error('provider_schema_unavailable')
  const orders = record(response.data).subscriptionOrders
  if (!Array.isArray(orders)) throw new Error('provider_schema_unavailable')
  // Ambiguous business references are not safe to recover.
  if (orders.length !== 1) continue
  const order = record(orders[0])
  const price = record(order.priceSnapshot)
  const start = period(order.currentPeriodStart), end = period(order.currentPeriodEnd)
  const n = order.currentPeriodNumber
  if (order.testMode !== true || typeof order.id !== 'string' || !order.id || (intent.order_id && intent.order_id !== order.id) || order.orderMerchantExternalId !== intent.request_id || order.merchantProvidedBuyerIdentity !== userId || record(order.subscriptionProduct).id !== product || order.billingPeriod !== 'monthly' || !['active','canceling'].includes(String(order.status)) || price.currency !== plan.currency || decimalCents(record(price.regularPhase).subtotal) !== plan.amountCents || !start || !end || start > observed || end <= observed || typeof n !== 'number' || !Number.isSafeInteger(n) || n < 1 || !Array.isArray(order.payments)) continue
  // A monthly period must be the next UTC calendar anniversary (clamped
  // for shorter months), not an arbitrary 28-31 day window.
  const anniversary = new Date(start)
  const day = anniversary.getUTCDate()
  anniversary.setUTCDate(1)
  anniversary.setUTCMonth(anniversary.getUTCMonth()+1)
  const lastDay = new Date(Date.UTC(anniversary.getUTCFullYear(),anniversary.getUTCMonth()+1,0)).getUTCDate()
  anniversary.setUTCDate(Math.min(day,lastDay))
  if (end !== anniversary.toISOString()) continue
  const payments = order.payments.map(record).filter(p=>p.periodNumber===n)
  // Conservatively reject any executed/pending/unknown refund for this period,
  // and incomplete refund data. No status/amount coercion or browser evidence.
  if (!payments.length || payments.some(p=>!Array.isArray(p.refunds) || p.refunds.length)) continue
  const paid = payments.filter(p=>typeof p.id==='string' && p.id && p.status==='succeeded' && record(p.snapshotAmountDetails).currency===plan.currency && decimalCents(record(p.snapshotAmountDetails).subtotal)===plan.amountCents)
  if (paid.length !== 1) continue
  const evidence = [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(order))))].map(b=>b.toString(16).padStart(2,'0')).join('')
  const auditId = `rec_${crypto.randomUUID()}`
  // Claim and ALL effects share one D1 transaction. Re-check live state inside
  // that transaction, not just before the provider roundtrip. Existing user
  // subscriptions intentionally block recovery (no stale resurrection/stacking).
  const auditExists = 'EXISTS (SELECT 1 FROM waffo_reconciliation_audits WHERE id=?)'
  const results = await env.DB.batch([
   env.DB.prepare(`INSERT OR IGNORE INTO waffo_reconciliation_audits
    (id,provenance,intent_id,user_id,store_id,order_id,payment_id,plan_id,product_id,amount_cents,currency,period_number,period_start,period_end,provider_status,evidence_sha256,observed_at)
    SELECT ?,'provider_read',?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS (
     SELECT 1 FROM checkout_intents i JOIN waffo_checkout_links l ON l.intent_id=i.id
     WHERE i.id=? AND i.user_id=? AND i.state='pending' AND i.mode='test' AND l.store_id=?
      AND i.request_id=? AND i.product_id=? AND i.expected_amount_cents=? AND i.expected_currency=?
      AND (l.order_id IS NULL OR l.order_id=?)
    ) AND NOT EXISTS (SELECT 1 FROM waffo_subscriptions WHERE user_id=? OR order_id=? OR intent_id=?)
      AND NOT EXISTS (SELECT 1 FROM subscriptions WHERE user_id=? AND (julianday(period_end) IS NULL OR julianday(period_end)>julianday(?)))
      AND NOT EXISTS (SELECT 1 FROM entitlement_ledger WHERE idempotency_key=?)`)
    .bind(auditId,intent.id,userId,env.WAFFO_STORE_ID_TEST,order.id,paid[0].id,plan.id,product,plan.amountCents,plan.currency,n,start,end,order.status,evidence,observed,intent.id,userId,env.WAFFO_STORE_ID_TEST,intent.request_id,product,plan.amountCents,plan.currency,order.id,userId,order.id,intent.id,userId,observed,`waffo-cycle:${order.id}:${start}`),
   env.DB.prepare(`INSERT INTO waffo_subscriptions (order_id,intent_id,user_id,plan_id,product_id,status,period_start,period_end,event_timestamp,updated_at)
    SELECT ?,?,?,?,?,?,?,?,?,? WHERE ${auditExists}`).bind(order.id,intent.id,userId,plan.id,product,order.status,start,end,start,observed,auditId),
   env.DB.prepare(`INSERT INTO waffo_billing_cycles (order_id,period_start,period_end,user_id,plan_id,credits_granted,created_at)
    SELECT ?,?,?,?,?,?,? WHERE ${auditExists}`).bind(order.id,start,end,userId,plan.id,plan.monthlyCredits,observed,auditId),
   env.DB.prepare(`INSERT INTO entitlement_ledger (id,user_id,plan_id,event_type,delta,idempotency_key,reference_id,created_at)
    SELECT ?,?,?,'grant',?,?,?,? WHERE ${auditExists}`).bind(`led_${crypto.randomUUID()}`,userId,plan.id,plan.monthlyCredits,`waffo-cycle:${order.id}:${start}`,order.id,observed,auditId),
   env.DB.prepare(`UPDATE waffo_checkout_links SET order_id=? WHERE intent_id=? AND ${auditExists}`).bind(order.id,intent.id,auditId),
   env.DB.prepare(`UPDATE checkout_intents SET state='subscription_active',updated_at=? WHERE id=? AND ${auditExists}`).bind(observed,intent.id,auditId),
  ])
  if (results[0].meta.changes === 1) return {reconciled:1,checked}
 }
 return {reconciled:0,checked}
}
