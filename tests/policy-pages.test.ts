import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { policies } from '../src/lib/policy-copy'
import { supportCategories, supportError, supportMessages, supportTicket, validateSupport } from '../src/lib/support-form'

const source = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const valid = { category: 'generation', email: 'adult@example.test', reference: '', message: 'My download is unavailable.' }
test('policy numbers and sidebar links retain AA colors, including hover', async () => {
  const css = await source('src/app/globals.css')
  const colorFor = (selector: string) => {
    const block = css.split(`${selector} {`)[1]?.split('}')[0]
    assert.ok(block, `Missing selector ${selector}`)
    return /(?:^|;)\s*color:\s*([^;]+);/.exec(block)?.[1]
  }
  assert.equal(colorFor('.policy-grid article > span'), '#b52665')
  assert.equal(colorFor('.sidebar-policies a'), 'var(--ink)')
  assert.equal(colorFor('.sidebar-policies a:hover'), '#b52665')
  const luminance = (hex: string) => [0, 2, 4].reduce((sum, offset, index) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return sum + [0.2126, 0.7152, 0.0722][index] * (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  }, 0)
  for (const [foreground, background] of [['b52665', 'ffffff'], ['26314d', 'f9fbff'], ['b52665', 'fff0f7']]) {
    const [dark, light] = [luminance(foreground), luminance(background)].sort((a, b) => a - b)
    assert.ok((light + 0.05) / (dark + 0.05) >= 4.5)
  }
})
test('five policy pages match every upstream prose paragraph and include email links', async () => {
  const screen = await source('src/screens/PolicyPages.tsx')
  assert.doesNotMatch(screen, /prototype-banner|Draft frontend content|draft pending review|Support intake prototype/)
  assert.match(screen, /mailto:support@coloringpageflow.com/)
  assert.match(screen, /SupportForm/)
  const upstream = await source('POLICY_USER_COPY_V1.md')
  for (const [index, policy] of Object.values(policies).entries()) {
    assert.ok(upstream.includes(`Title: ${policy.title}`))
    assert.ok(policy.sections.some(section => section.paragraphs.some(p => p.includes('(mailto:support@coloringpageflow.com)'))))
    const block = upstream.split(/## Page \d — /)[index + 1].split(/\n---|\n## 表单交接/)[0]
    const paragraphs = block.split(/\n\s*\n/).slice(1).map(p => p.trim()).filter(p => /^[A-Z]/.test(p) && !/^(Route:|Eyebrow:|Title:|Category choices:|Button:|While sending:|Safety note)/.test(p))
    const rendered = [policy.intro, ...policy.sections.flatMap(s => s.paragraphs)].join('\n')
    for (const paragraph of paragraphs) {
      if (paragraph.startsWith('Please fill in')) assert.ok((await source('src/components/SupportForm.tsx')).includes('Your message and contact details will be stored'))
      else assert.ok(rendered.includes(paragraph), `Missing upstream paragraph on ${policy.title}: ${paragraph}`)
    }
  }
})
test('support validation matches API categories, email, reference, Unicode and control-character limits', () => {
  for (const [category] of supportCategories) assert.deepEqual(validateSupport({ ...valid, category }), {})
  assert.ok(validateSupport({ ...valid, category: 'ACCOUNT' }).category)
  for (const email of ['', '.test@example.test', 'test..x@example.test', 'x.@example.test', `${'x'.repeat(65)}@example.test`, 'a@example.test\nBcc:x']) assert.ok(validateSupport({ ...valid, email }).email)
  assert.deepEqual(validateSupport({ ...valid, email: ' Adult@Example.Test ', reference: ' job_one:2.3-4 ' }), {})
  for (const reference of ['https://example.test', 'x'.repeat(129), '<script>']) assert.ok(validateSupport({ ...valid, reference }).reference)
  assert.ok(validateSupport({ ...valid, message: '   123456789   ' }).message)
  assert.deepEqual(validateSupport({ ...valid, message: '😀'.repeat(4000) }), {})
  assert.equal(validateSupport({ ...valid, message: '😀'.repeat(4001) }).message, supportMessages.longMessage)
  assert.ok(validateSupport({ ...valid, message: 'Hello world\u0000' }).message)
  assert.deepEqual(validateSupport({ ...valid, message: 'Hello\nworld\twith help' }), {})
})
test('only a 201 response with a server ticket may report success; errors are safe user copy', () => {
  const ticket = 'sup_12345678-1234-1234-1234-123456789abc'
  assert.equal(supportTicket(201, { data: { ticket_id: ticket } }), ticket)
  for (const status of [200, 400, 403, 413, 415, 429, 503]) assert.equal(supportTicket(status, { data: { ticket_id: ticket } }), null)
  for (const payload of [null, {}, { data: {} }, { data: { ticket_id: '' } }, { data: { ticket_id: '<script>' } }]) assert.equal(supportTicket(201, payload), null)
  assert.equal(supportError(400), supportMessages.invalid)
  assert.equal(supportError(413), supportMessages.large)
  assert.equal(supportError(429), supportMessages.limited)
  assert.equal(supportError(403), supportMessages.rejected)
  assert.equal(supportError(415), supportMessages.rejected)
  assert.equal(supportError(503), supportMessages.unavailable)
  assert.equal(supportError(500), supportMessages.unknown)
})
test('form sends only the four supported fields and includes busy, accessible feedback and sensitive-data warning', async () => {
  const form = await source('src/components/SupportForm.tsx')
  assert.match(form, /fetch\('\/api\/support'/)
  assert.match(form, /sending\.current = true/)
  assert.match(form, /if \(sending\.current\) return/)
  assert.match(form, /aria-live="polite"/)
  assert.match(form, /aria-invalid=/)
  assert.match(form, /formRef\.current\?\.querySelector/)
  assert.match(form, /private photos, student information/)
  assert.doesNotMatch(form, /innerHTML|console\.|user_id|type="file"/)
})
