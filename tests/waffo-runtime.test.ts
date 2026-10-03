import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign } from 'node:crypto'
import { build } from 'esbuild'
import { Miniflare } from 'miniflare'

// Exercise the actual SDK inside workerd; Node-only crypto success is insufficient.
test('Waffo SDK RSA verification executes inside workerd and rejects tampering', async () => {
  const built = await build({
    stdin: { contents: `import {verifyTestWebhook} from './src/lib/waffo-core';
      export default {async fetch(req,env) {try {verifyTestWebhook(await req.text(),req.headers.get('x-waffo-signature')||'',env.PUBLIC_KEY,'STO_runtime');return new Response('verified')}catch {return new Response('rejected',{status:401})}}};`,
      resolveDir: process.cwd(), sourcefile: 'waffo-runtime-entry.ts', loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'neutral',
    external: ['node:*'], alias: {crypto:'node:crypto'}, conditions: ['workerd','worker','import','default'],
  })
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048})
  const mf=new Miniflare({modules:true, script:built.outputFiles[0].text,
    compatibilityDate:'2026-08-02', compatibilityFlags:['nodejs_compat'],
    bindings:{PUBLIC_KEY:publicKey.export({type:'spki',format:'pem'}).toString()}})
  try {
    const raw=JSON.stringify({id:'runtime',eventType:'subscription.activated',mode:'test',storeId:'STO_runtime',data:{orderId:'ORD_runtime'}})
    const t=String(Date.now())
    const signature=`t=${t},v1=${sign('RSA-SHA256',Buffer.from(`${t}.${raw}`),privateKey).toString('base64')}`
    const send=(body:string)=>mf.dispatchFetch('https://runtime.test/api/webhooks/waffo',{method:'POST',body,headers:{'x-waffo-signature':signature}})
    assert.equal((await send(raw)).status,200)
    assert.equal((await send(raw+' ')).status,401)
  } finally {await mf.dispose()}
})
