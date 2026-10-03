import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign } from 'node:crypto'
import { verifyTestWebhook, waffoProductBinding, decimalCents, isWaffoCheckoutUrl } from '../src/lib/waffo-core'

test('Waffo Test verifies exact raw bytes with timestamp RSA signature and rejects prod/store mismatch', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString()
  const raw = JSON.stringify({ id: 'delivery', eventType: 'subscription.activated', mode: 'test', storeId: 'STO_test', data: { orderId: 'ORD_test' } })
  const t = String(Date.now())
  const signature = `t=${t},v1=${sign('RSA-SHA256', Buffer.from(`${t}.${raw}`), privateKey).toString('base64')}`
  assert.equal(verifyTestWebhook(raw, signature, pem, 'STO_test').id, 'delivery')
  assert.throws(() => verifyTestWebhook(raw + ' ', signature, pem, 'STO_test'))
  assert.throws(() => verifyTestWebhook(raw, signature, pem, 'STO_other'))
  const prod = raw.replace('"test"', '"prod"')
  const prodSig = `t=${t},v1=${sign('RSA-SHA256', Buffer.from(`${t}.${prod}`), privateKey).toString('base64')}`
  assert.throws(() => verifyTestWebhook(prod, prodSig, pem, 'STO_test'))
})

test('server mapping and decimal money fail closed', () => {
  assert.equal(waffoProductBinding('starter_monthly'), 'WAFFO_PRODUCT_STARTER_TEST')
  assert.equal(decimalCents('9.99'), 999)
  for (const value of ['9.999', '-1', '1e3', '', null, 9.99]) assert.equal(decimalCents(value), null)
  assert.ok(isWaffoCheckoutUrl('https://pancake.waffo.ai/store/test/checkout/session#token=abc'))
  assert.equal(isWaffoCheckoutUrl('https://pancake.waffo.ai.evil.test/store/test/checkout/x'), false)
})
