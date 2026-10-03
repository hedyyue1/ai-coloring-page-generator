import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Miniflare } from 'miniflare'
import { generateKeyPairSync, sign } from 'node:crypto'
import { handleWaffoWebhook } from '../src/lib/waffo-payment'
import { reconcileWaffoPayments } from '../src/lib/waffo-reconcile'

const now = new Date('2026-10-02T13:00:00Z')
const order = { id: 'ORD_recovery', testMode: true, orderMerchantExternalId: 'req_recovery', merchantProvidedBuyerIdentity: 'user', billingPeriod: 'monthly', status: 'active', subscriptionProduct: { id: 'PROD_starter' }, priceSnapshot: { currency: 'USD', regularPhase: { subtotal: '9.99' } }, currentPeriodStart: '2026-10-02T12:11:29Z', currentPeriodEnd: '2026-11-02T12:11:29Z', currentPeriodNumber: 1, payments: [{ id: 'PAY_recovery', status: 'succeeded', periodNumber: 1, snapshotAmountDetails: { currency: 'USD', subtotal: '9.99' }, refunds: [] }] }
async function setup() {
 const mf = new Miniflare({ modules:true, script:'export default {fetch(){return new Response("ok")}}', d1Databases:['DB'], compatibilityDate:'2026-08-02' })
 const DB = await mf.getD1Database('DB')
 for (const file of ['0001_auth_creem.sql','0004_waffo_test.sql','0005_waffo_reconciliation.sql']) await DB.exec((await readFile(`migrations/${file}`,'utf8')).replace(/^\s*--.*$/gm,'').replace(/\n/g,' '))
 await DB.prepare("INSERT INTO users VALUES ('user',NULL,NULL,'active','now','now')").run()
 await DB.prepare("INSERT INTO checkout_intents (id,request_id,user_id,plan_id,product_id,expected_amount_cents,expected_currency,mode,state,created_at,updated_at) VALUES ('intent','req_recovery','user','starter_monthly','PROD_starter',999,'USD','test','pending','2026-10-02T12:00:00Z','2026-10-02T12:00:00Z')").run()
 await DB.prepare("INSERT INTO waffo_checkout_links (intent_id,store_id) VALUES ('intent','STO_test')").run()
 const env = {DB,WAFFO_MODE:'test',PAYMENTS_TEST_MODE:'true',PAYMENTS_ENABLED:'true',WAFFO_STORE_ID_TEST:'STO_test',WAFFO_PRODUCT_STARTER_TEST:'PROD_starter'} as unknown as CloudflareEnv
 return {mf,DB,env}
}
const client = (fixture: unknown = order) => ({graphql:{query:async () => ({data:{subscriptionOrders:[fixture]}})}})

test('rejects a shortened calendar month even when the paid period is currently open', async () => {
 const {mf,env}=await setup()
 try { assert.equal((await reconcileWaffoPayments(env,'user',client({...order,currentPeriodEnd:'2026-10-30T12:11:29Z'}),now)).reconciled,0) }
 finally { await mf.dispose() }
})

test('provider-read recovery atomically grants the real paid cycle once with an audit', async () => {
 const {mf,DB,env}=await setup()
 try {
  assert.equal((await reconcileWaffoPayments(env,'user',client(),now)).reconciled,1)
  assert.equal((await reconcileWaffoPayments(env,'user',client(),now)).reconciled,0)
  assert.equal((await DB.prepare('SELECT SUM(delta) n FROM entitlement_ledger').first<{n:number}>())?.n,200)
  assert.equal((await DB.prepare('SELECT provenance FROM waffo_reconciliation_audits').first<{provenance:string}>())?.provenance,'provider_read')
  assert.equal((await DB.prepare('SELECT idempotency_key FROM entitlement_ledger').first<{idempotency_key:string}>())?.idempotency_key,'waffo-cycle:ORD_recovery:2026-10-02T12:11:29.000Z')
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048})
  env.WAFFO_WEBHOOK_PUBLIC_KEY_TEST=publicKey.export({type:'spki',format:'pem'}).toString()
  const raw=JSON.stringify({id:'evt_later',eventType:'subscription.activated',mode:'test',storeId:'STO_test',timestamp:'2026-10-02T12:11:30Z',data:{orderId:order.id,orderMerchantExternalId:order.orderMerchantExternalId,merchantProvidedBuyerIdentity:'user',currency:'USD'}})
  const t=String(Date.now()), signature=sign('RSA-SHA256',Buffer.from(`${t}.${raw}`),privateKey).toString('base64')
  assert.equal((await handleWaffoWebhook(env,new Request('https://site/api/webhooks/waffo',{method:'POST',body:raw,headers:{'x-waffo-signature':`t=${t},v1=${signature}`}}),{graphql:{query:async()=>({data:{subscriptionOrders:[order]}})}})).status,200)
  assert.equal((await DB.prepare('SELECT SUM(delta) n FROM entitlement_ledger').first<{n:number}>())?.n,200)
  assert.equal((await DB.prepare('SELECT COUNT(*) n FROM waffo_billing_cycles').first<{n:number}>())?.n,1)
  assert.equal((await DB.prepare('SELECT COUNT(*) n FROM waffo_reconciliation_audits').first<{n:number}>())?.n,1)
 } finally {await mf.dispose()}
})

const mismatches: [string,unknown][] = [
 ['live order',{...order,testMode:false}],
 ['missing test mode',{...order,testMode:undefined}],
 ['reference',{...order,orderMerchantExternalId:'req_other'}],
 ['identity',{...order,merchantProvidedBuyerIdentity:'attacker'}],
 ['missing identity',{...order,merchantProvidedBuyerIdentity:undefined}],
 ['product',{...order,subscriptionProduct:{id:'PROD_other'}}],
 ['currency',{...order,priceSnapshot:{...order.priceSnapshot,currency:'EUR'}}],
 ['amount',{...order,priceSnapshot:{currency:'USD',regularPhase:{subtotal:'9.98'}}}],
 ['numeric money',{...order,priceSnapshot:{currency:'USD',regularPhase:{subtotal:9.99}}}],
 ['annual',{...order,billingPeriod:'yearly'}],
 ['canceled',{...order,status:'canceled'}],
 ['past due',{...order,status:'past_due'}],
 ['expired',{...order,currentPeriodStart:'2026-09-02T12:11:29Z',currentPeriodEnd:'2026-10-02T12:11:29Z'}],
 ['future',{...order,currentPeriodStart:'2026-11-02T12:11:29Z',currentPeriodEnd:'2026-12-02T12:11:29Z'}],
 ['invalid date',{...order,currentPeriodStart:'bad'}],
 ['missing period number',{...order,currentPeriodNumber:null}],
 ['unpaid',{...order,payments:[]}],
 ['wrong payment period',{...order,payments:[{...order.payments[0],periodNumber:2}]}],
 ['failed payment',{...order,payments:[{...order.payments[0],status:'failed'}]}],
 ['wrong paid amount',{...order,payments:[{...order.payments[0],snapshotAmountDetails:{currency:'USD',subtotal:'0.00'}}]}],
 ['refunded',{...order,payments:[{...order.payments[0],refunds:[{id:'RFD',status:'succeeded'}]}]}],
 ['unknown refund schema',{...order,payments:[{...order.payments[0],refunds:undefined}]}],
 ['bad shape',null],
]
test('all provider mismatches fail closed with no effects in real local D1',async()=>{
 const {mf,DB,env}=await setup()
 try {
  for(const [name,fixture] of mismatches) assert.equal((await reconcileWaffoPayments(env,'user',client(fixture),now)).reconciled,0,name)
  for(const table of ['waffo_subscriptions','waffo_billing_cycles','entitlement_ledger','waffo_reconciliation_audits']) assert.equal((await DB.prepare(`SELECT COUNT(*) n FROM ${table}`).first<{n:number}>())?.n,0,table)
  assert.equal((await DB.prepare('SELECT state FROM checkout_intents').first<{state:string}>())?.state,'pending')
  await assert.rejects(reconcileWaffoPayments(env,'user',{graphql:{query:async()=>({errors:[{message:'unsupported field'}]})}},now),/provider_schema_unavailable/)
  assert.equal((await reconcileWaffoPayments(env,'attacker',client(),now)).checked,0)
 } finally {await mf.dispose()}
})

test('existing canceled/newer subscription and provider-roundtrip races cannot resurrect or grant',async()=>{
 const {mf,DB,env}=await setup()
 try {
  const racing={graphql:{query:async()=>{
   await DB.prepare("INSERT INTO waffo_subscriptions VALUES ('ORD_recovery','intent','user','starter_monthly','PROD_starter','canceled','2026-10-02T12:11:29.000Z','2026-11-02T12:11:29.000Z','2026-10-02T12:30:00.000Z','now')").run()
   return {data:{subscriptionOrders:[order]}}
  }}}
  assert.equal((await reconcileWaffoPayments(env,'user',racing,now)).reconciled,0)
  assert.equal((await DB.prepare('SELECT status FROM waffo_subscriptions').first<{status:string}>())?.status,'canceled')
  assert.equal((await reconcileWaffoPayments(env,'user',client(),now)).reconciled,0)
  assert.equal((await DB.prepare('SELECT COUNT(*) n FROM entitlement_ledger').first<{n:number}>())?.n,0)
 } finally {await mf.dispose()}
})

test('D1 batch failure rolls back audit, subscription, cycle and all remaining effects',async()=>{
 const {mf,DB,env}=await setup()
 try {
  await DB.exec("CREATE TRIGGER abort_grant BEFORE INSERT ON entitlement_ledger BEGIN SELECT RAISE(ABORT,'test grant failure'); END;")
  await assert.rejects(reconcileWaffoPayments(env,'user',client(),now),/test grant failure/)
  for(const table of ['waffo_subscriptions','waffo_billing_cycles','entitlement_ledger','waffo_reconciliation_audits']) assert.equal((await DB.prepare(`SELECT COUNT(*) n FROM ${table}`).first<{n:number}>())?.n,0,table)
  assert.equal((await DB.prepare('SELECT state FROM checkout_intents').first<{state:string}>())?.state,'pending')
 } finally {await mf.dispose()}
})

test('route binds session user and validates existing same-origin CSRF helper before provider writes',async()=>{
 const source=await readFile('src/app/api/checkout/reconcile/route.ts','utf8')
 assert.match(source,/export async function POST\(request: Request\)/)
 assert.match(source,/requireSession\(env, request\)/)
 assert.match(source,/if \(!user\) return apiError\('authentication_required', 401/)
 assert.match(source,/validateBrowserWrite\(env, request\)/)
 assert.match(source,/if \(writeError\) return writeError/)
 assert.match(source,/reconcileWaffoPayments\(env, user.id\)/)
 assert.ok(source.indexOf('if (!user)')<source.indexOf('validateBrowserWrite(env, request)'))
 assert.ok(source.indexOf('if (writeError)')<source.indexOf('reconcileWaffoPayments(env, user.id)'))
 assert.doesNotMatch(source,/request\.json|searchParams|handleWaffoWebhook|export.*GET/)
})
