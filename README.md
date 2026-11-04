# Savvy Coffee

Responsive recreation of the supplied Figma homepage, collection and product page, with Savvy branding and edited product photography.

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
- `/collections/all` — full collection with category anchors
- `/products/protein-coffee` — product page and bundle builder

Desktop and mobile layouts follow the six supplied frames in [Figma](https://www.figma.com/design/AMGvH2mTSt0AeSq80xlqOb/From-X-to-Figma). Typography and artwork are served locally. Sections are loaded as separate bundles.

The cart, quantities, bundle pricing, plan selection, gallery, menu and accordions work in the browser. Cart contents persist on the device. Checkout, account, newsletter submission and video playback are demonstration interfaces; no commerce backend or video files were supplied. Prices, reviews and promotional claims reproduce the supplied design, and are not live commerce data.

## Validation

`node scripts/interactions.mjs` exercises bundles, cart persistence, FAQ expansion and mobile navigation. `node scripts/check-pages.mjs` captures all three pages at 1440px and 390px and reports runtime errors and missing images. Start the dev server on port 5173 first. `node scripts/check-responsive.mjs` checks all three routes at eight widths from 320px to 3440px, including full-width surfaces, footer overlap, missing images and runtime errors. Set `CHECK_URL` to check a deployed site.

## Design sources

Homepage: `145:3` / `145:1427`; collection: `145:2661` / `145:4401`; product: `145:6186` / `145:8703`. Generated section markup preserves Figma node IDs for tracing. The compiled source and CSS are committed, so building requires no Figma connection.

The optional design preparation scripts require the original, uncommitted MCP export files in `design-reference/`. They are not part of the application build.

See [ASSET_NOTES.md](ASSET_NOTES.md) for the image editing process and outputs.

## Responsive layout

The page shell and promotional backgrounds fill the viewport. The homepage hero, social section and shared footer use native responsive layouts in `src/responsive.jsx` and `src/responsive.css`; the footer stacks into a two-column link grid on smaller screens. Exported sections retain their design geometry inside fluid content containers, capped at 1920px for readability. Collection content uses a wider 1760px container. The header keeps a readable navigation size independently of page scaling.
