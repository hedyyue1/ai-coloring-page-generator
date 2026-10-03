import {test} from 'node:test'
import {strict as assert} from 'node:assert'
import {readFileSync} from 'node:fs'

test('current payment UI uses Waffo Test, not retired Creem copy',()=>{
 for (const file of ['src/screens/Home.tsx','src/screens/ToolPages.tsx','src/screens/AccountPages.tsx','src/screens/PolicyPages.tsx','src/components/ProductLayout.tsx']) {
  const source=readFileSync(file,'utf8')
  assert.doesNotMatch(source,/Creem|CREEM/,file)
 }
 const pricing=readFileSync('src/screens/ToolPages.tsx','utf8')
 assert.match(pricing,/Waffo Test/)
 assert.doesNotMatch(pricing,/<td>Connected<\/td>/)
})
