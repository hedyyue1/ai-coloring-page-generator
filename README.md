# Linea — AI Coloring Page Generator (Frontend)

Next.js 15 + TypeScript + App Router rebuild of the Linea coloring-page frontend package.

## Stack

- Next.js 15 (App Router), React 19, TypeScript (strict)
- Custom CSS design system (`src/app/globals.css`, ported from the Linea V5 prototype `App.css`)
- lucide-react icons
- Deployment target: Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`)

## Scripts

```bash
npm install
npm run dev         # local dev server
npm run lint        # next lint
npm run typecheck   # tsc --noEmit
npm run build       # production build
```

## Cloudflare Workers deployment

The production adapter is `@opennextjs/cloudflare`; the Worker is named `ai-coloring-page-generator` and is published to its `workers.dev` endpoint only. The checked-in Wrangler configuration does not define routes or custom domains.

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run cf:build       # adapt the Next.js output into .open-next/
npm run cf:preview     # preview the already-adapted output with Wrangler
npm run cf:deploy      # deploy the already-adapted output to workers.dev
```

`npm run cf:upload` uploads a version without deploying it, and `npm run cf:typegen` refreshes the optional Cloudflare environment types. Before a release, run `npx wrangler whoami` and verify that the authenticated identity has access to the intended account and Worker. Never commit `.dev.vars`, `.env*`, `.wrangler/`, account identifiers, or credentials.

Deployment does not change the prototype boundary below: OAuth, checkout/Creem, generation, upload, and persistence remain mock frontend states rather than real integrations.

## Route map

| Route | Source component |
|---|---|
| `/` | `src/pages/Home.tsx` |
| `/photo-to-coloring-page` | `ToolPages.ToolPage mode="photo"` |
| `/text-to-coloring-page` | `ToolPages.ToolPage mode="text"` |
| `/pricing` | `ToolPages.PricingPage` |
| `/login` | `ToolPages.LoginPage` |
| `/account` | `AccountPages.AccountPage` |
| `/account/subscription` | `AccountPages.SubscriptionPage` |
| `/account/credits` | `AccountPages.CreditsPage` |
| `/account/data-deletion` | `AccountPages.DataDeletionPage` |
| `/checkout/pending` | `AccountPages.CheckoutStatePage type="pending"` |
| `/success` | `AccountPages.CheckoutStatePage type="success"` |
| `/cancel` | `AccountPages.CheckoutStatePage type="cancel"` |
| `/privacy` `/terms` `/acceptable-use` `/refunds` `/support` | `PolicyPages.PolicyPage` |
| 404 | `PolicyPages.NotFoundPage` via `not-found.tsx` |

Prototype boundary: no real OAuth, checkout, generation, upload, or persistence is connected. All interactive states are frontend previews.
