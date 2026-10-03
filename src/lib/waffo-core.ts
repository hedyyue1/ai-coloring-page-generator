import { verifyWebhook, type WebhookEvent, type WebhookEventData } from '@waffo/pancake-ts'
import type { PaidPlanId } from './creem-core'

export function waffoProductBinding(plan: PaidPlanId) {
  return { starter_monthly: 'WAFFO_PRODUCT_STARTER_TEST', standard_monthly: 'WAFFO_PRODUCT_STANDARD_TEST', premium_monthly: 'WAFFO_PRODUCT_PREMIUM_TEST' }[plan] as 'WAFFO_PRODUCT_STARTER_TEST' | 'WAFFO_PRODUCT_STANDARD_TEST' | 'WAFFO_PRODUCT_PREMIUM_TEST'
}

export function decimalCents(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+(\.\d{1,2})?$/.test(value)) return null
  const [whole, fraction = ''] = value.split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) ? cents : null
}

export function isWaffoCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'pancake.waffo.ai' && !url.username && !url.password && !url.port && /^\/store\/[^/]+\/checkout\/[^/]+$/.test(url.pathname)
  } catch { return false }
}

export function verifyTestWebhook(raw: string, signature: string, publicKey: string, storeId: string): WebhookEvent<WebhookEventData> {
  if (!publicKey || !storeId) throw new Error('waffo_not_configured')
  const event = verifyWebhook<WebhookEventData>(raw, signature, { publicKey, environment: 'test' })
  if (event.mode !== 'test' || event.storeId !== storeId || !event.id || !event.eventType || !event.data?.orderId) throw new Error('webhook_scope_mismatch')
  return event
}
