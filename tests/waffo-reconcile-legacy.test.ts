import {test} from 'node:test'
import {strict as assert} from 'node:assert'
import {readFile} from 'node:fs/promises'
import {Miniflare} from 'miniflare'
import {reconcileWaffoPayments} from '../src/lib/waffo-reconcile'
const now=new Date('2026-10-02T13:00:00Z')
const order={id:'ORD_recovery',testMode:true,orderMerchantExternalId:'req_recovery',merchantProvidedBuyerIdentity:'user',billingPeriod:'monthly',status:'active',subscriptionProduct:{id:'PROD_starter'},priceSnapshot:{currency:'USD',regularPhase:{subtotal:'9.99'}},currentPeriodStart:'2026-10-02T12:11:29Z',currentPeriodEnd:'2026-11-02T12:11:29Z',currentPeriodNumber:1,payments:[{id:'PAY_recovery',status:'succeeded',periodNumber:1,snapshotAmountDetails:{currency:'USD',subtotal:'9.99'},refunds:[]}]}
for(const [name,end,expected] of [['expired historical Creem','2026-09-02T13:07:33Z',1],['unexpired legacy Creem','2026-11-02T13:07:33Z',0],['unknown legacy expiry',null,0]] as const){
 test(name+' does not erase legacy state or stack an overlapping entitlement',async()=>{
 const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB'],compatibilityDate:'2026-08-02'})
 try{
 const DB=await mf.getD1Database('DB')
 for(const file of ['0001_auth_creem.sql','0004_waffo_test.sql','0005_waffo_reconciliation.sql'])await DB.exec((await readFile('migrations/'+file,'utf8')).replace(/^\s*--.*$/gm,'').replace(/\n/g,' '))
 await DB.prepare("INSERT INTO users VALUES ('user',NULL,NULL,'active','now','now')").run()
 await DB.prepare("INSERT INTO checkout_intents (id,request_id,user_id,plan_id,product_id,expected_amount_cents,expected_currency,mode,state,created_at,updated_at) VALUES ('intent','req_recovery','user','starter_monthly','PROD_starter',999,'USD','test','pending','2026-10-02T12:00:00Z','2026-10-02T12:00:00Z')").run()
 await DB.prepare("INSERT INTO waffo_checkout_links (intent_id,store_id) VALUES ('intent','STO_test')").run()
 await DB.prepare("INSERT INTO subscriptions (id,creem_subscription_id,user_id,plan_id,product_id,status,period_start,period_end,updated_at) VALUES ('old','old','user','premium_monthly','old_prod','paid','2026-08-02T13:07:33Z',?,'old')").bind(end).run()
 const env={DB,WAFFO_MODE:'test',PAYMENTS_TEST_MODE:'true',PAYMENTS_ENABLED:'true',WAFFO_STORE_ID_TEST:'STO_test',WAFFO_PRODUCT_STARTER_TEST:'PROD_starter'} as unknown as CloudflareEnv
 const result=await reconcileWaffoPayments(env,'user',{graphql:{query:async()=>({data:{subscriptionOrders:[order]}})}},now)
 assert.equal(result.reconciled,expected)
 assert.equal((await DB.prepare('SELECT status FROM subscriptions').first<{status:string}>())?.status,'paid')
 assert.equal((await DB.prepare('SELECT COALESCE(SUM(delta),0) AS credits FROM entitlement_ledger').first<{credits:number}>())?.credits,expected*200)
 }finally{await mf.dispose()}
 })
}
