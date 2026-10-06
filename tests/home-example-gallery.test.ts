import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

const examples = [
  '/examples/garden-cottage.svg',
  '/examples/cozy-cat.svg',
  '/examples/camping-memory.svg',
]

test('homepage includes a clearly labelled illustrative example gallery', async () => {
  const home = await source('src/screens/Home.tsx')

  assert.match(home, /id="examples"/)
  assert.match(home, /Illustrative examples/)
  assert.match(home, /These are original illustrations showing the kind of before-and-line-art comparison/)

  for (const src of examples) {
    assert.match(home, new RegExp(`src: '${src.replaceAll('/', '\\/')}'`))
    assert.match(await source(`public${src}`), /<svg[\s>]/)
  }
})

test('example gallery keeps responsive cards within the viewport', async () => {
  const styles = await source('src/app/globals.css')

  assert.match(styles, /\.example-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(styles, /\.example-card img\s*\{[\s\S]*?width:\s*100%/)
  assert.match(styles, /@media \(max-width: 900px\)[\s\S]*?\.example-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/)
})

test('pricing section remains on the homepage after the example gallery', async () => {
  const home = await source('src/screens/Home.tsx')
  const examplesIndex = home.indexOf('id="examples"')
  const pricingIndex = home.indexOf('id="pricing"')

  assert.ok(examplesIndex >= 0)
  assert.ok(pricingIndex > examplesIndex)
  assert.match(home, /Compare monthly plans/)
})
