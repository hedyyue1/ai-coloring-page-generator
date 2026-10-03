import assert from 'node:assert/strict'
import test from 'node:test'

import {
  catalogPlan,
  classifyCreemEvent,
  creemApiBase,
  extractCreemContext,
  isAllowedCreemCheckoutUrl,
  verifyCreemSignature,
} from '../src/lib/creem-core'

test('catalog accepts only paid V5 monthly plans and never trusts browser product or price fields', () => {
  assert.deepEqual(catalogPlan('standard_monthly'), {
    id: 'standard_monthly',
    amountCents: 1999,
    currency: 'USD',
    monthlyCredits: 500,
    productBinding: 'CREEM_PRODUCT_STANDARD_MONTHLY',
  })
  assert.equal(catalogPlan('free_monthly'), null)
  assert.equal(catalogPlan('premium_monthly', { product_id: 'prod_attacker', amount: 1 } as never)?.amountCents, 3999)
  assert.equal(catalogPlan('unknown'), null)
})

test('Creem mode selects only the documented Test or Live API origin', () => {
  assert.equal(creemApiBase('test'), 'https://test-api.creem.io/v1')
  assert.equal(creemApiBase('live'), 'https://api.creem.io/v1')
  assert.equal(creemApiBase('anything-else'), null)
})

test('webhook signature verifies HMAC-SHA256 over the exact raw body', async () => {
  const body = '{"id":"evt_1","eventType":"subscription.active"}'
  const secret = 'test-signing-secret'
  assert.equal(await verifyCreemSignature(body, secret, '0ad8a29d93a64da938136f0a37f73ba098aa386b344dbb120a774def929f2613'), true)
  assert.equal(await verifyCreemSignature(body + ' ', secret, '0ad8a29d93a64da938136f0a37f73ba098aa386b344dbb120a774def929f2613'), false)
  assert.equal(await verifyCreemSignature(body, secret, 'invalid'), false)
})

test('event classifier grants paid lifecycle events and fail-closes non-grant subscription states', () => {
  assert.equal(classifyCreemEvent('subscription.active'), 'activate')
  assert.equal(classifyCreemEvent('subscription.paid'), 'activate')
  assert.equal(classifyCreemEvent('subscription.canceled'), 'deactivate')
  assert.equal(classifyCreemEvent('subscription.expired'), 'deactivate')
  assert.equal(classifyCreemEvent('subscription.paused'), 'deactivate')
  assert.equal(classifyCreemEvent('subscription.trialing'), 'state_only')
  assert.equal(classifyCreemEvent('subscription.scheduled_cancel'), 'state_only')
  assert.equal(classifyCreemEvent('subscription.past_due'), 'state_only')
  assert.equal(classifyCreemEvent('refund.created'), 'state_only')
  assert.equal(classifyCreemEvent('dispute.created'), 'state_only')
  assert.equal(classifyCreemEvent('checkout.completed'), 'record_only')
  assert.equal(classifyCreemEvent('return.success'), 'ignore')
})

test('checkout navigation accepts HTTPS Creem hosts only', () => {
  assert.equal(isAllowedCreemCheckoutUrl('https://checkout.creem.io/ch_123'), true)
  assert.equal(isAllowedCreemCheckoutUrl('https://www.creem.io/test/payment/ch_123'), true)
  assert.equal(isAllowedCreemCheckoutUrl('https://creem.io.evil.example/ch_123'), false)
  assert.equal(isAllowedCreemCheckoutUrl('https://evil.example/ch_123'), false)
  assert.equal(isAllowedCreemCheckoutUrl('javascript:alert(1)'), false)
})

test('event context supports documented payload shape and requires server-mapped metadata', () => {
  const context = extractCreemContext({
    id: 'evt_1',
    eventType: 'subscription.active',
    object: {
      id: 'sub_1',
      product: { id: 'prod_standard' },
      order: { id: 'ord_1', amount: 1999, currency: 'USD' },
      metadata: { user_id: 'usr_1', plan_id: 'standard_monthly', request_id: 'req_1' },
      current_period_start_date: '2026-08-01T00:00:00Z',
      current_period_end_date: '2026-09-01T00:00:00Z',
    },
  })

  assert.deepEqual(context, {
    eventId: 'evt_1',
    eventType: 'subscription.active',
    subscriptionId: 'sub_1',
    orderId: 'ord_1',
    productId: 'prod_standard',
    amountCents: 1999,
    currency: 'USD',
    userId: 'usr_1',
    planId: 'standard_monthly',
    requestId: 'req_1',
    periodStart: '2026-08-01T00:00:00Z',
    periodEnd: '2026-09-01T00:00:00Z',
  })
})

test('event context reads recurring price and currency from the documented subscription product', () => {
  const context = extractCreemContext({
    id: 'evt_paid',
    eventType: 'subscription.paid',
    object: {
      id: 'sub_paid',
      product: { id: 'prod_paid', price: 1999, currency: 'USD' },
      metadata: { user_id: 'usr_paid', plan_id: 'standard_monthly', request_id: 'req_paid' },
      current_period_start_date: '2026-08-01T00:00:00Z',
      current_period_end_date: '2026-09-01T00:00:00Z',
    },
  })
  assert.equal(context.amountCents, 1999)
  assert.equal(context.currency, 'USD')
})
