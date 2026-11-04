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

`node scripts/interactions.mjs` exercises bundles, cart persistence, FAQ expansion and mobile navigation. `node scripts/check-pages.mjs` captures all three pages at 1440px and 390px and reports runtime errors and missing images. Start the dev server on port 5173 first. Additional responsive checks cover 320px–1920px.

## Design sources

Homepage: `145:3` / `145:1427`; collection: `145:2661` / `145:4401`; product: `145:6186` / `145:8703`. Generated section markup preserves Figma node IDs for tracing. The compiled source and CSS are committed, so building requires no Figma connection.

The optional design preparation scripts require the original, uncommitted MCP export files in `design-reference/`. They are not part of the application build.

See [ASSET_NOTES.md](ASSET_NOTES.md) for the image editing process and outputs.
