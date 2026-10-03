export type PaidPlanId = 'starter_monthly' | 'standard_monthly' | 'premium_monthly'

export type CatalogPlan = {
  id: PaidPlanId
  amountCents: number
  currency: 'USD'
  monthlyCredits: number
  productBinding:
    | 'CREEM_PRODUCT_STARTER_MONTHLY'
    | 'CREEM_PRODUCT_STANDARD_MONTHLY'
    | 'CREEM_PRODUCT_PREMIUM_MONTHLY'
}

const PLAN_CATALOG: Record<PaidPlanId, CatalogPlan> = {
  starter_monthly: {
    id: 'starter_monthly',
    amountCents: 999,
    currency: 'USD',
    monthlyCredits: 200,
    productBinding: 'CREEM_PRODUCT_STARTER_MONTHLY',
  },
  standard_monthly: {
    id: 'standard_monthly',
    amountCents: 1999,
    currency: 'USD',
    monthlyCredits: 500,
    productBinding: 'CREEM_PRODUCT_STANDARD_MONTHLY',
  },
  premium_monthly: {
    id: 'premium_monthly',
    amountCents: 3999,
    currency: 'USD',
    monthlyCredits: 1500,
    productBinding: 'CREEM_PRODUCT_PREMIUM_MONTHLY',
  },
}

export function catalogPlan(planId: string, _untrustedBrowserFields?: never): CatalogPlan | null {
  return Object.prototype.hasOwnProperty.call(PLAN_CATALOG, planId)
    ? PLAN_CATALOG[planId as PaidPlanId]
    : null
}

export function creemApiBase(mode: string | undefined): string | null {
  if (mode === 'test') return 'https://test-api.creem.io/v1'
  if (mode === 'live') return 'https://api.creem.io/v1'
  return null
}

export function isAllowedCreemCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'creem.io' || url.hostname.endsWith('.creem.io'))
  } catch {
    return false
  }
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqualText(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return mismatch === 0
}

export async function verifyCreemSignature(rawBody: string, secret: string, signature: string): Promise<boolean> {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const expected = toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)))
  return timingSafeEqualText(expected.toLowerCase(), signature.toLowerCase())
}

export type CreemEventAction = 'activate' | 'deactivate' | 'record_only' | 'state_only' | 'ignore'

export function classifyCreemEvent(eventType: string): CreemEventAction {
  if (['subscription.active', 'subscription.paid'].includes(eventType)) return 'activate'
  if (['subscription.canceled', 'subscription.expired', 'subscription.paused'].includes(eventType)) return 'deactivate'
  if (['subscription.trialing', 'subscription.scheduled_cancel', 'subscription.past_due', 'subscription.update', 'refund.created', 'dispute.created'].includes(eventType)) return 'state_only'
  if (eventType === 'checkout.completed') return 'record_only'
  return 'ignore'
}

type UnknownRecord = Record<string, unknown>

function record(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {}
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function integer(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isSafeInteger(number) ? number : null
}

export type CreemEventContext = {
  eventId: string
  eventType: string
  subscriptionId: string
  orderId: string
  productId: string
  amountCents: number | null
  currency: string
  userId: string
  planId: string
  requestId: string
  periodStart: string
  periodEnd: string
}

export function extractCreemContext(payload: unknown): CreemEventContext {
  const event = record(payload)
  const data = record(event.data)
  const object = record(event.object ?? data.object)
  const metadata = record(object.metadata)
  const product = record(object.product)
  const order = record(object.order)

  return {
    eventId: text(event.id),
    eventType: text(event.eventType || event.type),
    subscriptionId: text(object.id || object.subscription_id),
    orderId: text(order.id || object.order_id),
    productId: text(product.id || object.product_id),
    amountCents: integer(order.amount ?? object.amount ?? product.price),
    currency: text(order.currency || object.currency || product.currency).toUpperCase(),
    userId: text(metadata.user_id),
    planId: text(metadata.plan_id),
    requestId: text(metadata.request_id),
    periodStart: text(object.current_period_start_date || object.current_period_start),
    periodEnd: text(object.current_period_end_date || object.current_period_end),
  }
}
