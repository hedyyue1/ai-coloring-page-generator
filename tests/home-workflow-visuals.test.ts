import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const home = readFileSync(new URL('../src/screens/Home.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8')

const expectedVisuals = [
  '/workflow/choose-photo.svg',
  '/workflow/google-sign-in.svg',
  '/workflow/create-preview.svg',
  '/workflow/check-result.svg',
]

test('each homepage workflow step has a dedicated semantic visual', () => {
  for (const visual of expectedVisuals) {
    assert.match(home, new RegExp(`visual: '${visual.replaceAll('/', '\\/')}'`))
  }

  assert.match(home, /className="workflow-visual"/)
  assert.match(home, /visualAlt:/)
  assert.match(home, /alt=\{active\.visualAlt\}/)
  assert.doesNotMatch(home, /<figure className="workflow-visual" aria-hidden="true"/)
})

test('workflow visual layout has desktop and narrow-screen rules', () => {
  assert.match(css, /\.workflow-visual\s*\{/)
  assert.match(css, /\.workflow-visual img\s*\{/)
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.workflow-detail[\s\S]*grid-template-columns: 1fr/)
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.workflow-visual/)
})
