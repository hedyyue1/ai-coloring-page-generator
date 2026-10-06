import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('homepage workflow pairs every step with a unique semantic illustration', async () => {
  const home = await source('src/screens/Home.tsx')
  const styles = await source('src/app/globals.css')
  const expectedIllustrations = [
    '/workflow/choose-photo.svg',
    '/workflow/google-sign-in.svg',
    '/workflow/create-preview.svg',
    '/workflow/check-result.svg',
  ]

  for (const src of expectedIllustrations) {
    assert.match(home, new RegExp(`visual: '${src}'`))
    assert.match(await source(`public${src}`), /<svg[\s>]/)
  }

  assert.match(home, /<figure className="workflow-visual"/)
  assert.match(home, /<Image[\s\S]*?src=\{active\.visual\}[\s\S]*?alt=\{active\.visualAlt\}/)
  assert.equal((home.match(/visualAlt:\s*'[^']+'/g) ?? []).length, expectedIllustrations.length)
  assert.match(styles, /\.workflow-visual\s*\{[\s\S]*?aspect-ratio:\s*8\s*\/\s*5/)
  assert.match(styles, /@media[^}]*max-width:\s*900px[\s\S]*?\.workflow-detail\s*\{[\s\S]*?grid-template-columns:\s*1fr/)
})
