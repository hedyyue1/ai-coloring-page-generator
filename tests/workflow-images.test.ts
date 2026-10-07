import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const toolPages = readFileSync('src/screens/ToolPages.tsx', 'utf8')
const home = readFileSync('src/screens/Home.tsx', 'utf8')

const legacyAssets = [
  'public/workflow/upload-source.svg',
  'public/workflow/style-choose.svg',
  'public/workflow/download-result.svg',
  'public/examples/garden-cottage.svg',
  'public/examples/cozy-cat.svg',
  'public/examples/camping-memory.svg',
]

test('superseded SVG assets are removed from the production tree', () => {
  for (const asset of legacyAssets) {
    assert.equal(existsSync(asset), false, `${asset} should be removed`)
  }
})

test('tool pages reuse the revised examples instead of stale workflow art', () => {
  assert.match(toolPages, /<ComparisonCard/)
  assert.match(toolPages, /\/examples\/cottage-color\.jpg/)
  assert.match(toolPages, /\/examples\/cottage-line\.jpg/)
  assert.match(toolPages, /\/examples\/camp-color\.jpg/)
  assert.match(toolPages, /\/examples\/camp-line\.jpg/)
  assert.doesNotMatch(toolPages, /\/workflow\//)
  assert.doesNotMatch(home, /\/workflow\//)
})
