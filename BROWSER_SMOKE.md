# BROWSER_SMOKE — R8.1B Cloudflare Workers production

Production URL: <https://ai-coloring-page-generator.hedyyue1.workers.dev>

## Direct-refresh coverage

The following production URLs were opened directly in a real Chromium session after deployment. Each rendered its expected document title and primary page content instead of an application, routing, or Cloudflare error:

| Route | Document title | Result |
|---|---|---|
| `/` | `Linea — Photo & Text to Coloring Page` | pass |
| `/pricing` | `Pricing · Linea` | pass |
| `/photo-to-coloring-page` | `Photo to Coloring Page · Linea` | pass |
| `/account` | `Account · Linea` | pass |
| `/privacy` | `Privacy Policy · Linea` | pass |

## Interaction and boundary checks

- On `/photo-to-coloring-page`, toggling the rights-confirmation checkbox changed its checked state to `true`.
- Without a selected local file, `Preview generation reservation` correctly remained disabled.
- Clicking the in-app `/pricing` navigation link changed the live URL to `/pricing`; the destination title was `Pricing · Linea`.
- `/pricing` exposed four disabled purchase buttons, preserving the checkout hold required by the current product boundary.
- Browser console inspection returned 0 console messages and 0 JavaScript errors.

## Screenshot evidence

Screenshots are stored in the task workspace outside the Git repository so production evidence is not added to the application bundle:

- `../evidence-r8.1b-production/01-home-desktop-full.png`
- `../evidence-r8.1b-production/02-pricing-desktop-full.png`
- `../evidence-r8.1b-production/03-photo-workflow-full.png`
- `../evidence-r8.1b-production/04-account-desktop-full.png`
- `../evidence-r8.1b-production/05-privacy-desktop-full.png`

This smoke test validates the deployed frontend only. OAuth, checkout/Creem, generation, upload, and persistence remain intentionally unconnected prototype states.
