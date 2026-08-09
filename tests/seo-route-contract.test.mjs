import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

const publicRoutes = [
  '/',
  '/photo-to-coloring-page',
  '/text-to-coloring-page',
  '/support',
  '/terms',
  '/privacy',
  '/refunds',
  '/acceptable-use',
]

test('public pages declare canonicals against the configured production origin', async () => {
  const layout = await source('src/app/layout.tsx')
  const sitemap = await source('src/app/sitemap.ts')

  assert.match(layout, /metadataBase: new URL\('https:\/\/ai-coloring-page-generator\.hedyyue1\.workers\.dev'\)/)
  for (const route of publicRoutes) {
    const page = route === '/' ? 'src/app/page.tsx' : `src/app${route}/page.tsx`
    assert.match(await source(page), new RegExp(`canonical: '${route}'`))
    assert.match(sitemap, new RegExp(`'${route}'`))
  }
  assert.doesNotMatch(sitemap, /'\/pricing'/)
})

test('crawl-sensitive routes remain excluded from indexing', async () => {
  const robots = await source('src/app/robots.ts')
  const pricing = await source('src/app/pricing/page.tsx')
  const login = await source('src/app/login/page.tsx')
  const accountLayout = await source('src/app/account/layout.tsx')
  const checkoutLayout = await source('src/app/checkout/layout.tsx')
  const success = await source('src/app/success/page.tsx')
  const cancel = await source('src/app/cancel/page.tsx')

  for (const route of ['/account/', '/checkout/', '/login', '/success', '/cancel']) {
    assert.match(robots, new RegExp(`'${route}'`))
  }
  assert.match(pricing, /robots: \{ index: false, follow: true \}/)
  for (const page of [login, accountLayout, checkoutLayout, success, cancel]) {
    assert.match(page, /robots: \{ index: false, follow: false \}/)
  }
})
