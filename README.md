# Savvy Coffee

Responsive Savvy storefront based on the supplied Figma designs, with a shared product template, 65 individual product pages and connected information-page navigation.

## Run locally

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

## Pages

- `/` — homepage
- `/collections/all` — original full collection
- `/collections/:category` — searchable, sortable category pages
- `/products/protein-coffee` — Figma Protein Coffee bundle builder
- `/products/:product-id` — shared product template for all 65 catalog products
- `/pages/*`, `/policies/*`, `/account*`, `/checkout`, `/blogs/coffee/*` — footer, service and editorial pages

`src/catalog.json` contains the product data. `src/commerce.jsx` is the shared product and collection template; `src/routes.js` maps navigation; `src/content-pages.jsx` and `src/content-data.js` provide the information pages. Protein Coffee detail pages reuse the Figma feature sections. Typography and images are served locally, with high-resolution detail images for every product.

The cart, quantities, bundle pricing, plan selection, image enlargement, menu and accordions work in the browser. Cart contents persist on the device. Support forms and checkout provide explicitly local downloads. Payments, authentication, messaging and other live business services require approved connections; legal and business pages clearly identify missing approved content. See [QA.md](QA.md) for the full coverage and launch boundaries.

## Validation

`node scripts/qa-site.mjs` checks all 98 routes at desktop/mobile widths. `node scripts/qa-interactions.mjs` checks product links, prices, cart persistence, filters, forms and navigation.


`node scripts/interactions.mjs` exercises bundles, cart persistence, FAQ expansion and mobile navigation. `node scripts/check-pages.mjs` captures all three pages at 1440px and 390px and reports runtime errors and missing images. Start the dev server on port 5173 first. `node scripts/check-responsive.mjs` checks all three routes at eight widths from 320px to 3440px, including full-width surfaces, footer overlap, missing images and runtime errors. Set `CHECK_URL` to check a deployed site.

## Design sources

Homepage: `145:3` / `145:1427`; collection: `145:2661` / `145:4401`; product: `145:6186` / `145:8703`. Generated section markup preserves Figma node IDs for tracing. The compiled source and CSS are committed, so building requires no Figma connection.

The optional design preparation scripts require the original, uncommitted MCP export files in `design-reference/`. They are not part of the application build.

See [ASSET_NOTES.md](ASSET_NOTES.md) for the image editing process and outputs.

## Responsive layout

The page shell and promotional backgrounds fill the viewport. The homepage hero, social section and shared footer use native responsive layouts in `src/responsive.jsx` and `src/responsive.css`; the footer stacks into a two-column link grid on smaller screens. Exported sections retain their design geometry inside fluid content containers, capped at 1920px for readability. Collection content uses a wider 1760px container. The header keeps a readable navigation size independently of page scaling.

Optional catalog preparation scripts (`extract-catalog.mjs`, `build-catalog.mjs`, `prepare-product-details.mjs`) use ignored design-reference inputs. Normal builds use the committed catalog and image files and need no Figma connection or image-generation credentials.

## Shopify theme

The storefront is also packaged as a Shopify Online Store 2.0 theme in `theme/`. It uses Shopify products, variants, selling plans, inventory, cart, customer accounts, search, contact forms, newsletter forms and policy URLs while preserving the supplied desktop/mobile design sections.

```sh
npm run theme:build
npm run theme:qa
shopify theme check --path theme
```

The configured `staging` environment targets only the unpublished theme `Savvy - Official - Kunal` (`189974675680`) on `savvy-8mvrp1ew.myshopify.com`. See [SHOPIFY.md](SHOPIFY.md) for route/resource requirements and deployment evidence.
