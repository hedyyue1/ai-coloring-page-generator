import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Miniflare } from 'miniflare'
import { generateKeyPairSync, sign } from 'node:crypto'
import { handleWaffoWebhook, createWaffoCheckout } from '../src/lib/waffo-payment'

const config = { WAFFO_MODE: 'test', PAYMENTS_TEST_MODE: 'true', PAYMENTS_ENABLED: 'true', WAFFO_STORE_ID_TEST: 'STO_test', WAFFO_PRODUCT_STARTER_TEST: 'PROD_starter', WAFFO_MERCHANT_ID: 'MER_test', SITE_URL: 'https://ai-coloring-page-generator.hedyyue1.workers.dev' }
const order = { id: 'ORD_test', orderMerchantExternalId: 'req_test', billingPeriod: 'monthly', status: 'active', subscriptionProduct: { id: 'PROD_starter' }, priceSnapshot: { currency: 'USD', regularPhase: { subtotal: '9.99' } }, currentPeriodStart: '2026-10-01T00:00:00.000Z', currentPeriodEnd: '2026-11-01T00:00:00.000Z', currentPeriodNumber: 1, payments: [{ id: 'PAY_test', status: 'succeeded', periodNumber: 1, snapshotAmountDetails: { currency: 'USD', subtotal: '9.99' } }] }

test('real local D1: signed webhook grants once per cycle, rejects mapping conflicts, and retries provider errors', async () => {
 const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("ok")}}', d1Databases: ['DB'], compatibilityDate: '2026-08-02' })
 try {
 const DB = await mf.getD1Database('DB')
 await DB.exec((await readFile('migrations/0001_auth_creem.sql', 'utf8')).replace(/^\s*--.*$/gm, '').replace(/\n/g, ' '))
 await DB.exec((await readFile('migrations/0004_waffo_test.sql', 'utf8')).replace(/^\s*--.*$/gm, '').replace(/\n/g, ' '))
 await DB.prepare("INSERT INTO users VALUES ('user',NULL,NULL,'active','now','now')").run()
 await DB.prepare("INSERT INTO checkout_intents (id,request_id,user_id,plan_id,product_id,expected_amount_cents,expected_currency,mode,state,created_at,updated_at) VALUES ('intent','req_test','user','starter_monthly','PROD_starter',999,'USD','test','pending','now','now')").run()
 await DB.prepare("INSERT INTO waffo_checkout_links (intent_id,store_id) VALUES ('intent','STO_test')").run()
 const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
 const env = { ...config, DB, WAFFO_WEBHOOK_PUBLIC_KEY_TEST: publicKey.export({ type:'spki', format:'pem' }).toString(), WAFFO_PRIVATE_KEY_TEST: privateKey.export({ type:'pkcs8', format:'pem' }).toString() } as unknown as CloudflareEnv
 const request = (id: string, type='subscription.activated', changes={}) => {
 const raw = JSON.stringify({ id,eventType:type,mode:'test',storeId:'STO_test',timestamp: id === 'e7' ? '2026-10-02T00:00:00.000Z' : '2026-10-01T00:00:00.000Z',data:{ orderId:'ORD_test',orderMerchantExternalId:'req_test',merchantProvidedBuyerIdentity:'user',currency:'USD',...changes } })
 const t = String(Date.now()); const signature=sign('RSA-SHA256',Buffer.from(`${t}.${raw}`),privateKey).toString('base64')
 return new Request('https://site/api/webhooks/waffo',{method:'POST',body:raw,headers:{'x-waffo-signature':`t=${t},v1=${signature}`}})
 }
 const client = { graphql:{query:async () => ({data:{subscriptionOrders:[order]}})} }
 assert.equal((await handleWaffoWebhook(env,request('e1'),client)).status,200)
 assert.equal((await handleWaffoWebhook(env,request('e1'),client)).status,200)
 assert.equal((await handleWaffoWebhook(env,request('e2','subscription.renewed'),client)).status,200)
 assert.equal((await DB.prepare('SELECT SUM(delta) AS n FROM entitlement_ledger').first<{n:number}>())?.n,200)
 assert.equal((await handleWaffoWebhook(env,request('e3',undefined,{merchantProvidedBuyerIdentity:'attacker'}),client)).status,409)
 const bad = {graphql:{query:async () => ({data:{subscriptionOrders:[{...order,subscriptionProduct:{id:'PROD_other'}}]}})}}
 assert.equal((await handleWaffoWebhook(env,request('e4'),bad)).status,409)
 const unpaid = {graphql:{query:async () => ({data:{subscriptionOrders:[{...order,payments:[]}]}})}}
 assert.equal((await handleWaffoWebhook(env,request('e5'),unpaid)).status,503)
 assert.equal((await handleWaffoWebhook(env,request('e5'),client)).status,200)
 assert.equal((await handleWaffoWebhook(env,request('e6','subscription.payment_succeeded'),client)).status,200)
 assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM entitlement_ledger').first<{n:number}>())?.n,1)
 assert.equal((await handleWaffoWebhook(env,request('e7','subscription.canceled'),client)).status,200)
 assert.equal((await DB.prepare('SELECT status FROM waffo_subscriptions').first<{status:string}>())?.status,'canceled')
 // Unsupported reconciliation must remain retryable, not be acknowledged as handled.
 assert.equal((await handleWaffoWebhook(env,request('refund_pending','refund.succeeded'),client)).status,503)
 assert.notEqual((await DB.prepare("SELECT state FROM waffo_webhook_events WHERE event_id='refund_pending'").first<{state:string}>())?.state,'processed')
 } finally { await mf.dispose() }
})

test('checkout calls official authenticated SDK with server identity, reference and no browser money', async () => {
 let params: any; let options: any
 const statements: string[]=[]
 const DB={ batch:async (_statements: unknown[])=>[], prepare:(sql:string) => { statements.push(sql); return {bind:()=>({run:async()=>({})})} } }
 const client={checkout:{authenticated:{create:async (p:any,o:any)=>{params=p;options=o;return {sessionId:'session',checkoutUrl:'https://pancake.waffo.ai/store/test/checkout/session#token=x'}}}}}
 const env={...config,DB} as unknown as CloudflareEnv
 const result=await createWaffoCheckout(env,{id:'user'},'starter_monthly','req_test','intent',client)
 assert.equal(result.checkoutUrl,'https://pancake.waffo.ai/store/test/checkout/session#token=x')
 assert.deepEqual(params,{ productId:'PROD_starter',currency:'USD',buyerIdentity:'user',withTrial:false,successUrl:config.SITE_URL+'/checkout/pending?request_id=req_test',orderMerchantExternalId:'req_test',metadata:{user_id:'user',plan_id:'starter_monthly',request_id:'req_test'} })
 assert.equal(options.idempotencyKey,'req_test')
 assert.equal('priceSnapshot' in params,false)
 assert.ok(statements.some(s=>s.includes('waffo_checkout_links')))
})
