import {strict as assert} from 'node:assert'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import {runInNewContext} from 'node:vm'
import ts from 'typescript'
import {apiJson,apiError} from '../src/lib/api-response'

// Run each actual UI handler against a fixture from the real API envelope helper.
// No real provider session or user identity is fabricated by these local tests.
function handler(file: string,response: Response) {
 const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
 let code=''
 function visit(node: ts.Node){
  if(ts.isFunctionDeclaration(node)&&node.name?.text==='beginCheckout') code=node.getText(source)
  ts.forEachChild(node,visit)
 }
 visit(source)
 assert.ok(code,'actual beginCheckout function found')
 const js=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
 const state={redirect:'',error:'',busy:'' as string|null}
 const invoke=runInNewContext(js+';beginCheckout',{
  secureCheckout:async()=>response,
  setBusyPlan:(v:string|null)=>{state.busy=v},setCheckoutError:(v:string)=>{state.error=v},
  window:{location:{assign:(v:string)=>{state.redirect=v}}},Error,encodeURIComponent,
 }) as (plan:string)=>Promise<void>
 return {state,invoke}
}
for(const file of ['src/screens/Home.tsx','src/screens/ToolPages.tsx']){
 test(file+': API data.checkout_url navigates instead of temporarily unavailable',async()=>{
  const url='https://pancake.waffo.ai/store/local-test-fixture/checkout/local-test-fixture'
  const {state,invoke}=handler(file,apiJson({data:{checkout_url:url,status:'pending'},request_id:'local-test-fixture'}))
  await invoke('starter_monthly')
  assert.equal(state.error,'')
  assert.equal(state.redirect,url)
 })
 test(file+': anonymous response redirects to normal Google login',async()=>{
  const {state,invoke}=handler(file,apiError('authentication_required',401,'Sign in first'))
  await invoke('starter_monthly')
  assert.match(state.redirect,/^\/api\/auth\/google\/start\?returnTo=/)
  assert.equal(state.error,'')
 })
 test(file+': provider failure displays message without redirect',async()=>{
  const {state,invoke}=handler(file,apiError('checkout_provider_error',502,'Waffo Test checkout could not be created.',true))
  await invoke('starter_monthly')
  assert.equal(state.redirect,'')
  assert.equal(state.error,'Waffo Test checkout could not be created.')
  assert.equal(state.busy,null)
 })
 test(file+': missing URL does not invent a checkout redirect',async()=>{
  const {state,invoke}=handler(file,apiJson({data:{status:'pending'}}))
  await invoke('starter_monthly')
  assert.equal(state.redirect,'')
  assert.equal(state.error,'Checkout is temporarily unavailable.')
 })
}
