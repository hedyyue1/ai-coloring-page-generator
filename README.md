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
