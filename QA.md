# Savvy website QA

## Coverage

- 98 routes: homepage, full collection, Protein Coffee bundle builder, 65 individual products, 6 category collections, 18 information/service pages and 6 recipe/journal detail pages.
- All 98 routes checked in Chromium at 390px and 1440px: **196 route/viewport combinations passed**.
- Checked for a single visible main heading, missing images, JavaScript/console errors, invalid internal destinations, nested anchors and horizontal page overflow.
- Every catalog product has an individual product link, including all 10 products marked sold out in the supplied design.
- Representative products from all 6 categories additionally checked at 320px, 768px, 1920px and 3440px. Footer edges and purchase-button geometry checked at each size.

## Functional checks

- Product image and title navigation; individual product content; image enlargement.
- Subscription and one-time plans; quantity tiers; price calculations.
- Cart quantities, reload persistence, checkout review and cart-summary download.
- Catalog filtering, sorting, empty search results and sold-out purchase prevention.
- Support enquiry download and its explicit not-sent confirmation.
- Device privacy preference persistence.
- Newsletter email handoff and validation.
- Footer navigation, mobile menu navigation, browser Back/Forward and unknown-page handling.
- Direct navigation to bundle purchase options using a URL fragment.
- Review expansion, feedback scoped to the current visit, customer-photo preview and category arrows.
- Production build succeeds. Dependency audit reports no known vulnerabilities.

These are browser tests using Chromium and simulated viewport sizes, not physical-device or Safari tests.

## Content and service boundaries

Product names, supplied descriptions, prices, availability labels and existing promotional content come from the provided Figma design. The catalog is a design snapshot, not a live inventory feed. Complete nutrition panels, accessory sizes/care specifications and descriptions were not supplied for every product; missing facts are not invented.

The pages and navigation are implemented. The following require business inputs or service connections before a transactional launch:

- Payment processing, order placement and shipping/tax calculation.
- Customer authentication, order history and subscription management.
- Support delivery, newsletter delivery and review submission.
- Approved returns/refund, terms and privacy policy text.
- Official social accounts, retailer locations, giveaway rules and affiliate/wholesale programme terms.
- Playable video files; the design supplied thumbnail images.

Support/affiliate/wholesale/privacy forms prepare a local download and do not send requests. Checkout downloads a cart summary and does not place an order. Privacy preferences are saved only in this browser. These boundaries are stated on the relevant pages.

## Reproduce

Start `npm run dev`, then run:

```sh
node scripts/qa-site.mjs
node scripts/qa-interactions.mjs
node scripts/interactions.mjs
node scripts/check-responsive.mjs
npm run build
npm audit
```

`CHECK_URL=https://savvy-cro-optimized.vercel.app` points the new route and interaction checks at production. Route reports and screenshots are saved locally under ignored `qa/`.
