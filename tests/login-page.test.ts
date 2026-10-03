import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)

function loginHarness(search = '', response: { ok: boolean; user?: unknown } = { ok: true, user: null }) {
  const effects: (() => void | (() => void))[] = []
  const replacements: string[] = []
  const requests: { url: string; options: RequestInit }[] = []
  const states: unknown[] = []
  let index = 0
  const module = { exports: {} as { LoginPage: React.ComponentType } }
  const source = readFileSync(new URL('../src/screens/ToolPages.tsx', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
  vm.runInNewContext(code, {
    module, exports: module.exports, URLSearchParams, AbortController,
    window: { location: { search, replace: (path: string) => replacements.push(path) } },
    fetch: async (url: string, options: RequestInit) => {
      requests.push({ url, options })
      return { ok: response.ok, json: async () => ({ user: response.user }) }
    },
    require: (id: string) => {
      if (id === 'react') return { ...React,
        useEffect: (effect: () => void | (() => void)) => effects.push(effect),
        useState: (initial: unknown) => {
          const slot = index++
          if (!(slot in states)) states[slot] = initial
          return [states[slot], (value: unknown) => { states[slot] = value }]
        },
      }
      if (id === 'next/navigation') return { useRouter: () => ({ replace: (path: string) => replacements.push(path) }) }
      if (id === '../components/ProductLayout') return { __esModule: true, default: ({ children }: { children: React.ReactNode }) => React.createElement('main', {}, children) }
      if (id === '../components/ComparisonCard') return { __esModule: true, default: () => null }
      return require(id)
    },
  })
  const render = () => { index = 0; return renderToStaticMarkup(React.createElement(module.exports.LoginPage)) }
  return { render, effects, replacements, requests }
}

test('login removes the entire left copy and state picker while retaining Google card and account CTA', () => {
  const html = loginHarness().render()
  assert.doesNotMatch(html, /login-copy|login-state-list|Google OpenID Connect|Sign in to attach credits|proof of image rights/)
  assert.match(html, /class="login-card"/)
  assert.match(html, /Continue with Google/)
  assert.match(html, /href="\/api\/auth\/google\/start\?returnTo=%2Faccount"/)
})

test('a validated signed-in session replaces login with account, even on an OAuth error URL', async () => {
  for (const search of ['', '?error=sign_in_failed']) {
    const harness = loginHarness(search, { ok: true, user: { id: 'session-fixture' } })
    harness.render()
    harness.effects.forEach((effect) => effect())
    await new Promise((resolve) => setImmediate(resolve))
    assert.deepEqual(harness.replacements, ['/account'])
    assert.equal(harness.requests[0].url, '/api/me')
    assert.equal(harness.requests[0].options.cache, 'no-store')
    assert.equal(harness.requests[0].options.credentials, 'include')
  }
})

test('anonymous OAuth failure stays on login and offers recovery with the Google CTA', async () => {
  const harness = loginHarness('?error=sign_in_failed')
  harness.render()
  harness.effects.forEach((effect) => effect())
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(harness.replacements, [])
  assert.match(harness.render(), /Google sign-in did not finish\. Please try again\./)
  assert.match(harness.render(), /returnTo=%2Faccount/)
})

test('failed session requests do not redirect from login', async () => {
  const harness = loginHarness('', { ok: false, user: { id: 'untrusted' } })
  harness.render()
  harness.effects.forEach((effect) => effect())
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(harness.replacements, [])
})

test('an unmounted login ignores late session responses', async () => {
  const harness = loginHarness('', { ok: true, user: { id: 'session-fixture' } })
  harness.render()
  harness.effects.forEach((effect) => { const cleanup = effect(); if (cleanup) cleanup() })
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(harness.replacements, [])
})
