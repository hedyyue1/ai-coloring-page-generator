import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const home = readFileSync('src/screens/Home.tsx', 'utf8')
const productLayout = readFileSync('src/components/ProductLayout.tsx', 'utf8')
const comparison = readFileSync('src/components/ComparisonCard.tsx', 'utf8')
const css = readFileSync('src/app/globals.css', 'utf8')

test('revised home composes the complete design system sections', () => {
  for (const marker of [
    'hero-panel',
    'hero-assurance',
    'feature-split',
    'steps-grid',
    'gallery-grid',
    'pricing-grid',
    'faq-list',
    'final-cta',
  ]) {
    assert.match(home, new RegExp(marker))
  }

  assert.match(home, /const plans = \[/)
  for (const plan of ['Free', 'Starter', 'Standard', 'Premium']) {
    assert.match(home, new RegExp(`name: '${plan}'`))
  }
})

test('comparison card is interactive and exposes an accessible range input', () => {
  assert.match(comparison, /useState\(52\)/)
  assert.match(comparison, /type="range"/)
  assert.match(comparison, /aria-label="Compare photo and coloring page"/)
  assert.match(comparison, /comparison-stage/)
})

test('mobile navigation has an accessible toggle and a compact breakpoint', () => {
  assert.match(productLayout, /className="menu-toggle"/)
  assert.match(productLayout, /aria-expanded=\{menuOpen\}/)
  assert.match(productLayout, /Open navigation menu/)
  assert.match(css, /@media\s*\(max-width:\s*1080px\)/)
  assert.match(css, /\.menu-toggle\s*\{[\s\S]*?display:\s*grid/)
})
