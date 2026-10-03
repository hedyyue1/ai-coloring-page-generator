import { WaffoPancake, type AuthenticatedCheckoutParams, type RequestOptions, type WebhookEventData } from '@waffo/pancake-ts'
import { catalogPlan } from './creem-core'
import { apiError, apiJson } from './api-response'
import { decimalCents, isWaffoCheckoutUrl, verifyTestWebhook, waffoProductBinding } from './waffo-core'

export function waffoClient(env: CloudflareEnv) {
  if (env.WAFFO_MODE !== 'test' || !env.WAFFO_MERCHANT_ID || !env.WAFFO_PRIVATE_KEY_TEST) throw new Error('waffo_not_configured')
  // API key itself determines environment; never add X-Environment on this path.
  return new WaffoPancake({ merchantId: env.WAFFO_MERCHANT_ID, privateKey: env.WAFFO_PRIVATE_KEY_TEST })
}

type CheckoutClient = { checkout: { authenticated: { create(params: AuthenticatedCheckoutParams, options?: RequestOptions): Promise<{ sessionId: string; checkoutUrl: string }> } } }
export async function createWaffoCheckout(env: CloudflareEnv, user: { id: string }, planId: string, requestId: string, intentId: string, client: CheckoutClient = waffoClient(env)) {
  const plan = catalogPlan(planId)
  const productId = plan && env[waffoProductBinding(plan.id)]
  if (!plan || !productId || !env.WAFFO_STORE_ID_TEST) throw new Error('waffo_not_configured')
  await env.DB.prepare('INSERT INTO waffo_checkout_links (intent_id,store_id) VALUES (?,?)').bind(intentId,env.WAFFO_STORE_ID_TEST).run()
  const result = await client.checkout.authenticated.create({
    productId, currency: plan.currency, buyerIdentity: user.id, withTrial: false,
    successUrl: `${env.SITE_URL}/checkout/pending?request_id=${encodeURIComponent(requestId)}`,
    orderMerchantExternalId: requestId,
    metadata: { user_id: user.id, plan_id: plan.id, request_id: requestId },
  }, { idempotencyKey: requestId })
  if (!result.sessionId || !isWaffoCheckoutUrl(result.checkoutUrl)) throw new Error('waffo_invalid_checkout')
  await env.DB.batch([
    env.DB.prepare('UPDATE waffo_checkout_links SET session_id = ? WHERE intent_id = ?').bind(result.sessionId,intentId),
    env.DB.prepare("UPDATE checkout_intents SET state = 'pending', updated_at = ? WHERE id = ?").bind(new Date().toISOString(),intentId),
  ])
  return result
}

type Intent = { id: string; user_id: string; plan_id: string; product_id: string; expected_amount_cents: number; expected_currency: string; order_id: string | null }
type Order = {
 id: string; orderMerchantExternalId: string; billingPeriod: string; status: string;
 subscriptionProduct: { id: string }; priceSnapshot: { currency: string; regularPhase: { subtotal: string } };
 currentPeriodStart: string; currentPeriodEnd: string; currentPeriodNumber: number;
 payments: {id:string;status:string;periodNumber:number;snapshotAmountDetails:{currency:string;subtotal:string}}[]
}
type QueryClient = { graphql: { query(params: {query: string; variables: Record<string, unknown>}): Promise<{ data?: { subscriptionOrders: Order[] } | null; errors?: unknown[] }> } }
// Fields from official Orders & Payments docs + SDK 0.25.0 GraphQL guide.
const ORDER_QUERY = `query($storeId: String!, $ref: String!) {
 subscriptionOrders(storeId: $storeId, filter: { orderMerchantExternalId: { eq: $ref } }) {
  id orderMerchantExternalId status billingPeriod currentPeriodStart currentPeriodEnd currentPeriodNumber
  subscriptionProduct { id }
  priceSnapshot { currency regularPhase { subtotal } }
  payments { id status periodNumber snapshotAmountDetails { currency subtotal } }
 }
}`
const domainEvents = ['subscription.activated','subscription.renewed','subscription.recovered']
const stateEvents = ['subscription.canceling','subscription.uncanceled','subscription.canceled','subscription.past_due']
const recordEvents = ['order.completed','subscription.payment_succeeded','refund.succeeded','refund.failed','subscription.plan_changed','subscription.plan_change_scheduled','subscription.plan_change_failed']

export async function handleWaffoWebhook(env: CloudflareEnv, request: Request, injectedClient?: QueryClient): Promise<Response> {
 if (env.WAFFO_MODE !== 'test' || env.PAYMENTS_TEST_MODE !== 'true' || !env.WAFFO_WEBHOOK_PUBLIC_KEY_TEST || !env.WAFFO_STORE_ID_TEST) return apiError('waffo_not_configured',503,'Waffo Test webhook is not configured.')
 const raw = await request.text()
 let event
 try { event=verifyTestWebhook(raw,request.headers.get('x-waffo-signature') || '',env.WAFFO_WEBHOOK_PUBLIC_KEY_TEST,env.WAFFO_STORE_ID_TEST) }
 catch { return apiError('webhook_signature_or_scope_invalid',401,'Webhook rejected.') }
 const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))].map(n=>n.toString(16).padStart(2,'0')).join('')
 const now = new Date().toISOString()
 await env.DB.prepare("INSERT OR IGNORE INTO waffo_webhook_events (event_id,event_type,payload_hash,state,received_at) VALUES (?,?,?,'received',?)").bind(event.id,event.eventType,hash,now).run()
 const receipt=await env.DB.prepare('SELECT payload_hash,state FROM waffo_webhook_events WHERE event_id=?').bind(event.id).first<{payload_hash:string;state:string}>()
 if (!receipt || receipt.payload_hash!==hash) return apiError('webhook_event_conflict',409,'Conflicting delivery.')
 if (receipt.state==='processed') return apiJson({ok:true,duplicate:true})
 const finish=()=>env.DB.prepare("UPDATE waffo_webhook_events SET state='processed',processed_at=? WHERE event_id=?").bind(now,event.id)
 const data=event.data as WebhookEventData
 if (![...domainEvents,...stateEvents,...recordEvents].includes(event.eventType)) {
  await finish().run(); return apiJson({ok:true,ignored:true})
 }
 const intent=await env.DB.prepare(`SELECT i.*,l.order_id FROM checkout_intents i JOIN waffo_checkout_links l ON l.intent_id=i.id
 WHERE i.request_id=? AND i.mode='test' AND l.store_id=?`).bind(data.orderMerchantExternalId || '',event.storeId).first<Intent>()
 const plan=intent && catalogPlan(intent.plan_id)
 const configured=plan && env[waffoProductBinding(plan.id)]
 if (!intent || !plan || !configured || intent.product_id!==configured || data.merchantProvidedBuyerIdentity!==intent.user_id || data.currency!==intent.expected_currency || (intent.order_id && intent.order_id!==data.orderId)) return apiError('webhook_mapping_mismatch',409,'Order mapping rejected.')
 try {
  const client: QueryClient = injectedClient || { graphql: { query: (params) => waffoClient(env).graphql.query<{ subscriptionOrders: Order[] }>(params) } }
  const result=await client.graphql.query({query:ORDER_QUERY,variables:{storeId:event.storeId,ref:data.orderMerchantExternalId}})
  if (result.errors?.length || !result.data) return apiError('waffo_reconciliation_unavailable',503,'Order verification unavailable.',true)
  const order=result.data.subscriptionOrders.find(o=>o.id===data.orderId)
  if (!order || order.orderMerchantExternalId!==data.orderMerchantExternalId || order.subscriptionProduct?.id!==configured || order.billingPeriod!=='monthly' || order.priceSnapshot?.currency!==intent.expected_currency || decimalCents(order.priceSnapshot.regularPhase?.subtotal)!==intent.expected_amount_cents) return apiError('webhook_mapping_mismatch',409,'Provider order mapping rejected.')
  // Payment-only events have no periods in SDK 0.25: never invent those fields.
  // Plan changes / refunds require reconciliation; never grant extra credits here.
  if (recordEvents.includes(event.eventType)) {
   if (event.eventType === 'refund.succeeded' || event.eventType.includes('plan_change')) {
    // Retain the receipt for retry/reconciliation. Never claim an unapplied
    // refund or plan transition was successfully handled.
    return apiError('waffo_reconciliation_required',503,'Refund or plan transition requires reconciliation.',true)
   }
   await env.DB.batch([env.DB.prepare('UPDATE waffo_checkout_links SET order_id=? WHERE intent_id=? AND (order_id IS NULL OR order_id=?)').bind(order.id,intent.id,order.id),finish()])
   return apiJson({ok:true,entitlement_granted:false,reconciliation_required:event.eventType.startsWith('refund.') || event.eventType.includes('plan_change')})
  }
  const eventTime=Date.parse(event.timestamp)
  if (!Number.isFinite(eventTime)) return apiError('invalid_event_time',400,'Invalid event timestamp.')
  const start=new Date(order.currentPeriodStart).toISOString(); const end=new Date(order.currentPeriodEnd).toISOString()
  if (start>=end) return apiError('invalid_billing_period',409,'Invalid period.')
  const grant=domainEvents.includes(event.eventType)
  if (grant && (!['active','canceling'].includes(order.status) || !Number.isInteger(order.currentPeriodNumber) || order.currentPeriodNumber<1 || !order.payments.some(p=>p.periodNumber===order.currentPeriodNumber && p.status==='succeeded' && p.snapshotAmountDetails.currency===intent.expected_currency && decimalCents(p.snapshotAmountDetails.subtotal)===intent.expected_amount_cents))) return apiError('waffo_paid_period_unverified',503,'Paid period not yet verified.',true)
  const status=event.eventType==='subscription.canceled' ? 'canceled' : event.eventType==='subscription.past_due' ? 'past_due' : event.eventType==='subscription.canceling' ? 'canceling' : order.status
  const timestamp=new Date(eventTime).toISOString()
  const statements=[
   env.DB.prepare('UPDATE waffo_checkout_links SET order_id=? WHERE intent_id=? AND (order_id IS NULL OR order_id=?)').bind(order.id,intent.id,order.id),
   env.DB.prepare(`INSERT INTO waffo_subscriptions (order_id,intent_id,user_id,plan_id,product_id,status,period_start,period_end,event_timestamp,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(order_id) DO UPDATE SET status=excluded.status,period_start=excluded.period_start,period_end=excluded.period_end,event_timestamp=excluded.event_timestamp,updated_at=excluded.updated_at
    WHERE excluded.event_timestamp>waffo_subscriptions.event_timestamp`).bind(order.id,intent.id,intent.user_id,plan.id,configured,status,start,end,timestamp,now),
  ]
  if (grant) {
   const cycleKey=`waffo-cycle:${order.id}:${start}`
   statements.push(
    env.DB.prepare(`INSERT OR IGNORE INTO waffo_billing_cycles (order_id,period_start,period_end,user_id,plan_id,credits_granted,created_at) VALUES (?,?,?,?,?,?,?)`).bind(order.id,start,end,intent.user_id,plan.id,plan.monthlyCredits,now),
    env.DB.prepare(`INSERT OR IGNORE INTO entitlement_ledger (id,user_id,plan_id,event_type,delta,idempotency_key,reference_id,created_at)
     SELECT ?,?,?, 'grant',?,?,?,? WHERE EXISTS (SELECT 1 FROM waffo_billing_cycles WHERE order_id=? AND period_start=? AND period_end=? AND user_id=? AND plan_id=?)`).bind(`led_${crypto.randomUUID()}`,intent.user_id,plan.id,plan.monthlyCredits,cycleKey,order.id,now,order.id,start,end,intent.user_id,plan.id),
    env.DB.prepare("UPDATE checkout_intents SET state='subscription_active',updated_at=? WHERE id=?").bind(now,intent.id),
   )
  }
  statements.push(finish())
  // D1 batch is atomic; delivery completion and unique cycle/ledger grants commit together.
  await env.DB.batch(statements)
  return apiJson({ok:true,entitlement_granted:grant})
 } catch { return apiError('waffo_processing_failed',503,'Webhook verification or processing unavailable.',true) }
}
