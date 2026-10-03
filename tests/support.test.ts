import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { build } from 'esbuild'
import { Miniflare } from 'miniflare'

const origin = 'https://coloringpageflow.com'
const valid = { category: 'generation', email: 'adult@example.test', reference: 'job_example', message: 'My coloring page was not delivered.' }
const globals = globalThis as typeof globalThis & { __supportEnv?: unknown }

async function handler() {
  const built = await build({
    entryPoints: ['src/app/api/support/route.ts'], bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: [{ name: 'support-context', setup(builder) {
      builder.onResolve({ filter: /^@opennextjs\/cloudflare$/ }, () => ({ path: 'context', namespace: 'fixture' }))
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
        contents: 'export async function getCloudflareContext() { return {env: globalThis.__supportEnv} }', loader: 'js',
      }))
    } }],
  })
  return import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`)
}

function request(body: unknown = valid, headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/support`, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
}

test('real support POST persists anonymous feedback in local D1 and returns only a public ticket', async () => {
  const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("fixture")}}', d1Databases: ['DB'] })
  try {
    const db = await mf.getD1Database('DB')
    const sql = await readFile('migrations/0006_support_requests.sql', 'utf8')
    for (const statement of sql.split(';').filter(part => part.trim())) await db.prepare(statement).run()
    globals.__supportEnv = { SITE_URL: origin, DB: db }
    const app = await handler()
    const response = await app.POST(request())
    assert.equal(response.status, 201)
    assert.equal(response.headers.get('cache-control'), 'no-store, private')
    const body = await response.json()
    assert.deepEqual(Object.keys(body.data).sort(), ['ticket_id'])
    assert.match(body.data.ticket_id, /^sup_[0-9a-f-]{36}$/)
    const row = await db.prepare('SELECT * FROM support_requests WHERE ticket_id = ?').bind(body.data.ticket_id).first()
    assert.equal(row?.category, valid.category)
    assert.equal(row?.email, valid.email)
    assert.equal(row?.reference, valid.reference)
    assert.equal(row?.message, valid.message)
    assert.equal(row?.status, 'open')
    assert.ok(row?.created_at)
  } finally { delete globals.__supportEnv; await mf.dispose() }
})

test('support validates browser origin, JSON and fields before touching D1', async () => {
  const app = await handler()
  let writes = 0
  globals.__supportEnv = { DB: { prepare() { writes++; throw new Error('private database details') } } }
  const cases: [Request, number][] = [
    [request(valid, { origin: 'https://evil.example' }), 403],
    [request(valid, { origin: '' }), 403],
    [request(valid, { origin: `${origin}/path` }), 403],
    [request(valid, { origin: 'null' }), 403],
    [request(valid, { 'sec-fetch-site': 'cross-site' }), 403],
    [request(valid, { 'content-type': 'text/plain' }), 415],
    [request(null), 400], [request([]), 400],
    [request({ ...valid, category: 'admin' }), 400],
    [request({ ...valid, category: 42 }), 400],
    [request({ ...valid, email: 'x\r\nBcc:evil@example.test' }), 400],
    [request({ ...valid, email: 'not-an-email' }), 400],
    [request({ ...valid, email: `${'a'.repeat(255)}@example.test` }), 400],
    [request({ ...valid, reference: "job_'; DROP TABLE users; --" }), 400],
    [request({ ...valid, reference: 'x'.repeat(129) }), 400],
    [request({ ...valid, message: 'short' }), 400],
    [request({ ...valid, message: '🌈'.repeat(5) }), 400],
    [request({ ...valid, message: ' '.repeat(30) }), 400],
    [request({ ...valid, message: 'x'.repeat(4001) }), 400],
    [request({ ...valid, message: 'A message with \u0000 in it.' }), 400],
    [request({ ...valid, user_id: 'usr_victim' }), 400],
    [request({ ...valid, status: 'resolved' }), 400],
    [request({ ...valid, message: '🌈'.repeat(9000) }), 413],
    [new Request(`${origin}/api/support`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{invalid' }), 400],
    [new Request('https://evil.example/api/support', { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: JSON.stringify(valid) }), 403],
  ]
  try {
    for (const [input, status] of cases) {
      const response = await app.POST(input)
      assert.equal(response.status, status, `case ${cases.findIndex(([item]) => item === input)}`)
      assert.equal(response.headers.get('cache-control'), 'no-store, private')
      assert.doesNotMatch(await response.text(), /private database details/)
    }
    assert.equal(writes, 0)
    const failure = await app.POST(request())
    assert.equal(failure.status, 503)
    assert.doesNotMatch(await failure.text(), /private database details/)
    globals.__supportEnv = {}
    assert.equal((await app.POST(request())).status, 503)
  } finally { delete globals.__supportEnv }
})

test('support limits concurrent intake atomically in D1, expires the window and stores hostile text inertly', async () => {
  const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("fixture")}}', d1Databases: ['DB'] })
  try {
    const db = await mf.getD1Database('DB')
    const sql = await readFile('migrations/0006_support_requests.sql', 'utf8')
    for (const statement of sql.split(';').filter(part => part.trim())) await db.prepare(statement).run()
    globals.__supportEnv = { DB: db }
    const app = await handler()
    const malicious = "<script>alert('x')</script>'; DROP TABLE support_requests; --"
    const responses = await Promise.all(Array.from({ length: 10 }, () => app.POST(request({ ...valid, email: ' ADULT@EXAMPLE.TEST ', message: malicious }))))
    assert.equal(responses.filter(item => item.status === 201).length, 3)
    assert.equal(responses.filter(item => item.status === 429).length, 7)
    assert.equal(responses.find(item => item.status === 429)?.headers.get('retry-after'), '3600')
    const rows = await db.prepare('SELECT email, message FROM support_requests').all()
    assert.equal(rows.results.length, 3)
    assert.ok(rows.results.every((row: Record<string, unknown>) => row.email === valid.email && row.message === malicious))
    await db.prepare('UPDATE support_requests SET created_at = ?').bind(new Date(Date.now() - 3601000).toISOString()).run()
    assert.equal((await app.POST(request())).status, 201)
    await db.batch(Array.from({ length: 99 }, (_, index) => db.prepare('INSERT INTO support_requests (ticket_id, category, email, message, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(`fixture_${index}`, 'other', `fixture${index}@example.test`, valid.message, new Date().toISOString())))
    assert.equal((await app.POST(request({ ...valid, email: 'new@example.test' }))).status, 429)
    const count = await db.prepare('SELECT count(*) AS total FROM support_requests').first()
    assert.equal(count?.total, 103)
  } finally { delete globals.__supportEnv; await mf.dispose() }
})

test('support never reports acceptance for unsuccessful D1 execution', async () => {
  const app = await handler()
  globals.__supportEnv = { DB: { prepare() { return { bind() { return this }, async run() { return { success: false, meta: { changes: 1 } } } } } } }
  try {
    assert.equal((await app.POST(request())).status, 503)
  } finally { delete globals.__supportEnv }
})

test('real support handler runs in workerd on finalized existing schema and three project origins', async () => {
  const built = await build({
    stdin: { contents: `import {POST} from './src/app/api/support/route';
      export default {async fetch(request,env) {globalThis.__supportEnv=env;return POST(request)}};`, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'neutral',
    plugins: [{ name: 'workerd-context', setup(builder) {
      builder.onResolve({ filter: /^@opennextjs\/cloudflare$/ }, () => ({ path: 'context', namespace: 'fixture' }))
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export async function getCloudflareContext() {return {env:globalThis.__supportEnv}}', loader: 'js' }))
    } }],
  })
  const mf = new Miniflare({ modules: true, script: built.outputFiles[0].text, d1Databases: ['DB'] })
  try {
    const db = await mf.getD1Database('DB')
    // Current 0001 already contains the columns that historical repair 0002 adds.
    // Do not blindly replay that repair. This test uses the finalized baseline;
    // the pre-existing replay conflict is explicitly recorded in the handoff.
    for (const file of ['0001_auth_creem.sql', '0003_r85_runtime_contract.sql', '0004_waffo_test.sql', '0005_waffo_reconciliation.sql', '0006_support_requests.sql']) {
      const sql = await readFile(`migrations/${file}`, 'utf8')
      const statements = sql.replace(/^\s*--.*$/gm, '').split(';').filter(part => part.trim())
      for (const statement of statements) await db.prepare(statement).run()
    }
    const categories = ['account', 'payment', 'generation', 'deletion', 'refund', 'complaint', 'other']
    const origins = [origin, 'https://www.coloringpageflow.com', 'https://ai-coloring-page-generator.hedyyue1.workers.dev']
    for (const [index, category] of categories.entries()) {
      const host = origins[index % origins.length]
      const result = await mf.dispatchFetch(`${host}/api/support`, {
        method: 'POST', headers: { origin: host, 'content-type': 'application/json; charset=utf-8', 'sec-fetch-site': 'same-origin', cookie: '__Host-linea_session=invalid%ZZ' },
        body: JSON.stringify({ category, email: `${category}@example.test`, message: valid.message }),
      })
      assert.equal(result.status, 201)
    }
    const mismatch = await mf.dispatchFetch(`${origin}/api/support`, { method: 'POST', headers: { origin: origins[1], 'content-type': 'application/json' }, body: JSON.stringify(valid) })
    assert.equal(mismatch.status, 403)
    const tooLarge = await mf.dispatchFetch(`${origin}/api/support`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ ...valid, message: 'x'.repeat(17000) }) })
    assert.equal(tooLarge.status, 413)
    const rows = await db.prepare('SELECT reference, status FROM support_requests').all()
    assert.equal(rows.results.length, categories.length)
    assert.ok(rows.results.every((row: Record<string, unknown>) => row.reference === null && row.status === 'open'))
    assert.equal((await db.prepare('SELECT count(*) AS total FROM users').first())?.total, 0)
  } finally { await mf.dispose() }
})
