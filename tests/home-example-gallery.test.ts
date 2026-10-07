import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import sharp from 'sharp'

const home = readFileSync('src/screens/Home.tsx', 'utf8')
const css = readFileSync('src/app/globals.css', 'utf8')

const pairs = ['cottage', 'cat', 'camp'] as const
const expectedSize = { width: 1536, height: 930 }

test('revised gallery ships three matched color and line-art pairs', async () => {
  for (const name of pairs) {
    for (const variant of ['color', 'line'] as const) {
      const path = `public/examples/${name}-${variant}.jpg`
      assert.equal(existsSync(path), true, `${path} should exist`)
      const { width, height } = await sharp(path).metadata()
      assert.deepEqual({ width, height }, expectedSize, `${path} should preserve the revised pair dimensions`)
      assert.match(home, new RegExp(`/examples/${name}-${variant}\\.jpg`))
    }
  }
})

test('gallery uses a responsive three-to-one column layout without legacy artwork', () => {
  assert.match(css, /\.gallery-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/)
  assert.match(css, /@media\s*\(max-width:\s*860px\)[\s\S]*?\.gallery-grid[\s\S]*?grid-template-columns:\s*1fr/)
  assert.doesNotMatch(home, /camping-memory|cozy-cat|garden-cottage|\/workflow\//)
})
