import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {compile} from '../scripts/remote-d1-reconciliation-adapter'
test('operator bound SQL quotes strings without allowing SQL injection',()=>{
 assert.equal(compile('SELECT ?',['a\u0027; DROP TABLE users; --']),"SELECT 'a''; DROP TABLE users; --'")
 assert.equal(compile('SELECT ?,?',[null,200]),'SELECT NULL,200')
})
test('operator bound SQL fails closed on unsupported or mismatched params',()=>{
 assert.throws(()=>compile('SELECT ?',[]))
 assert.throws(()=>compile('SELECT 1',['extra']))
 assert.throws(()=>compile('SELECT ?',[NaN]))
 assert.throws(()=>compile('SELECT ?',[undefined]))
})
