import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const routes = [
  'src/app/api/auth/google/start/route.ts',
  'src/app/api/auth/google/callback/route.ts',
  'src/app/api/auth/logout/route.ts',
  'src/app/api/me/route.ts',
  'src/app/api/config/public/route.ts',
  'src/app/api/checkout/session/route.ts',
  'src/app/api/webhooks/creem/route.ts',
]

test('OpenNext Cloudflare API routes stay in the default server bundle runtime', async () => {
  for (const route of routes) {
    const source = await readFile(new URL(`../${route}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /export const runtime\s*=\s*['"]edge['"]/, route)
  }
})
