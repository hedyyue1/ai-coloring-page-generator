import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Execute the actual hook, not a copy of its refresh implementation.
const source = readFileSync(new URL('../src/screens/AccountPages.tsx', import.meta.url), 'utf8')
const ast = ts.createSourceFile('AccountPages.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const hook = ast.statements.find((node): node is ts.FunctionDeclaration =>
  ts.isFunctionDeclaration(node) && node.name?.text === 'useAccountSnapshot')
assert.ok(hook, 'Account hook must exist')
const executable = ts.transpileModule(hook.getText(ast), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText

function harness() {
  let state: any
  let updates = 0
  let cleanup: (() => void) | undefined
  let now = 0
  let nextTimer = 0
  const timers = new Map<number, { callback: () => void; delay: number; next: number }>()
  function eventTarget() {
    const listeners = new Map<string, Set<() => void>>()
    return {
      addEventListener(name: string, listener: () => void) {
        if (!listeners.has(name)) listeners.set(name, new Set())
        listeners.get(name)!.add(listener)
      },
      removeEventListener(name: string, listener: () => void) { listeners.get(name)?.delete(listener) },
      dispatch(name: string) { for (const listener of listeners.get(name) ?? []) listener() },
      count() { return [...listeners.values()].reduce((sum, set) => sum + set.size, 0) },
    }
  }
  const window = eventTarget()
  const document = { ...eventTarget(), visibilityState: 'visible' }
  const requests: Array<{
    url: string; options: RequestInit
    resolve: (response: unknown) => void; reject: (error: unknown) => void
  }> = []
  const setInterval = (callback: () => void, delay: number) => {
    const id = ++nextTimer
    timers.set(id, { callback, delay, next: now + delay })
    return id
  }
  const clearInterval = (id: number) => { timers.delete(id) }
  const context = vm.createContext({
    window: Object.assign(window, { setInterval, clearInterval }), document,
    setInterval, clearInterval, AbortController,
    fetch: (url: string, options: RequestInit) => new Promise((resolve, reject) => {
      requests.push({ url, options, resolve, reject })
    }),
    useState: (initial: unknown) => {
      state = initial
      return [state, (next: any) => { state = typeof next === 'function' ? next(state) : next; updates++ }]
    },
    useEffect: (effect: () => () => void) => { cleanup = effect() },
  })
  vm.runInContext(`${executable}\nuseAccountSnapshot()`, context)
  return {
    requests, window, document, timers,
    get state() { return state },
    get updates() { return updates },
    unmount() { cleanup?.() },
    tick(milliseconds: number) {
      const end = now + milliseconds
      while (true) {
        const earliest = [...timers.values()].sort((a, b) => a.next - b.next)[0]
        if (!earliest || earliest.next > end) break
        now = earliest.next
        earliest.next += earliest.delay
        earliest.callback()
      }
      now = end
    },
    async respond(index: number, body: unknown, status = 200) {
      requests[index].resolve({ ok: status >= 200 && status < 300, status, json: async () => body })
      await flush()
    },
  }
}

async function flush() { for (let i = 0; i < 12; i++) await Promise.resolve() }
const initial = { user: { id: 'account', availableCredits: 0, subscription: null }, creditLedger: [] }
const paid = {
  user: { id: 'account', availableCredits: 200, subscription: { planId: 'starter_monthly', status: 'active' } },
  creditLedger: [{ id: 'grant', delta: 200 }],
}

test('mount requests account and polls at exactly five seconds to update entitlements', async () => {
  const h = harness()
  assert.equal(h.requests.length, 1)
  assert.equal(h.requests[0].url, '/api/me')
  assert.equal(h.requests[0].options.cache, 'no-store')
  await h.respond(0, initial)
  h.tick(4999)
  assert.equal(h.requests.length, 1)
  h.tick(1)
  assert.equal(h.requests.length, 2)
  await h.respond(1, paid)
  assert.equal(h.state.user.availableCredits, 200)
  assert.equal(h.state.user.subscription.status, 'active')
  assert.equal(h.state.creditLedger[0].id, 'grant')
  h.unmount()
})

test('focus and becoming visible refresh, hidden visibility changes do not', async () => {
  const h = harness()
  await h.respond(0, initial)
  h.window.dispatch('focus')
  assert.equal(h.requests.length, 2)
  await h.respond(1, initial)
  h.document.visibilityState = 'hidden'
  h.document.dispatch('visibilitychange')
  assert.equal(h.requests.length, 2)
  h.document.visibilityState = 'visible'
  h.document.dispatch('visibilitychange')
  assert.equal(h.requests.length, 3)
  await h.respond(2, paid)
  assert.equal(h.state.user.availableCredits, 200)
  h.unmount()
})

test('interval and events never overlap an in-flight request, including JSON parsing', async () => {
  const h = harness()
  h.tick(15000)
  h.window.dispatch('focus')
  h.document.dispatch('visibilitychange')
  assert.equal(h.requests.length, 1)
  let resolveJson!: (body: unknown) => void
  h.requests[0].resolve({ ok: true, json: () => new Promise(resolve => { resolveJson = resolve }) })
  await flush()
  h.tick(5000)
  assert.equal(h.requests.length, 1)
  resolveJson(initial)
  await flush()
  h.tick(5000)
  assert.equal(h.requests.length, 2)
  h.unmount()
})

test('HTTP failures preserve previous account data and show only a safe error, then recover', async () => {
  const h = harness()
  await h.respond(0, paid)
  const user = h.state.user
  const ledger = h.state.creditLedger
  h.tick(5000)
  await h.respond(1, { user: null, creditLedger: [], error: 'private upstream error' }, 503)
  assert.equal(h.state.user, user)
  assert.equal(h.state.creditLedger, ledger)
  assert.match(h.state.error, /Account state could not be loaded/)
  assert.doesNotMatch(h.state.error, /private|503/)
  h.tick(5000)
  await h.respond(2, paid)
  assert.equal(h.state.error, '')
  h.unmount()
})

test('network and JSON failures preserve data and release the in-flight guard', async () => {
  const h = harness()
  await h.respond(0, paid)
  h.tick(5000)
  h.requests[1].reject(new Error('private network detail'))
  await flush()
  assert.equal(h.state.user.availableCredits, 200)
  assert.equal(h.state.creditLedger[0].id, 'grant')
  assert.ok(h.state.error)
  h.tick(5000)
  h.requests[2].resolve({ ok: true, json: async () => { throw new Error('private parse detail') } })
  await flush()
  assert.equal(h.state.user.availableCredits, 200)
  assert.doesNotMatch(h.state.error, /private/)
  h.tick(5000)
  await h.respond(3, paid)
  assert.equal(h.state.error, '')
  h.unmount()
})

test('initial HTTP error does not pretend that the user signed out', async () => {
  const h = harness()
  await h.respond(0, { user: null }, 401)
  assert.equal(h.state.user, undefined)
  assert.ok(h.state.error)
  h.tick(5000)
  await h.respond(1, { user: null, creditLedger: [] })
  assert.equal(h.state.user, null, 'only a successful anonymous response establishes signed-out state')
  assert.equal(h.state.error, '')
  h.unmount()
})

test('unmount aborts the request, clears timer/listeners and ignores late completion', async () => {
  const h = harness()
  const signal = h.requests[0].options.signal
  assert.ok(signal)
  assert.equal(signal.aborted, false)
  const updates = h.updates
  h.unmount()
  assert.equal(signal.aborted, true)
  assert.equal(h.timers.size, 0)
  assert.equal(h.window.count(), 0)
  assert.equal(h.document.count(), 0)
  h.tick(15000)
  h.window.dispatch('focus')
  h.document.dispatch('visibilitychange')
  await h.respond(0, paid)
  assert.equal(h.requests.length, 1)
  assert.equal(h.updates, updates)
})

test('unmount during JSON parsing ignores late data and abort rejection has no state writes', async () => {
  const h = harness()
  let resolveJson!: (body: unknown) => void
  h.requests[0].resolve({ ok: true, json: () => new Promise(resolve => { resolveJson = resolve }) })
  await flush()
  h.unmount()
  resolveJson(paid)
  await flush()
  assert.equal(h.updates, 0)
  const aborted = harness()
  aborted.unmount()
  aborted.requests[0].reject(new DOMException('Aborted', 'AbortError'))
  await flush()
  assert.equal(aborted.updates, 0)
})
