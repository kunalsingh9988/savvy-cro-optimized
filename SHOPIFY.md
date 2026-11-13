# Savvy Shopify theme

## Target

- Store: `savvy-8mvrp1ew.myshopify.com`
- Theme: `Savvy - Official - Kunal`
- Theme ID: `189974675680`
- Role: unpublished
- Preview: `https://savvy-8mvrp1ew.myshopify.com?preview_theme_id=189974675680`

The live theme is separate and is not changed by the `staging` environment.

## Theme coverage

- Responsive homepage with native header, full-width hero, Figma sections, social section and footer.
- Full collection design for `/collections/all` and native searchable/sortable category templates.
- Shared native product template for every Shopify product, plus the supplied flagship bundle-builder design for the `protein-coffee` handle.
- Native variant, selling-plan, inventory, quantity, cart and customer-account integration.
- Shopify contact and newsletter forms, search, cart, article, blog, policy and 404 templates.
- Footer/service templates for giveaway, recipes, support, reviews, affiliate, wholesale, privacy choices, store locator, newsletter, community and media.
- 630 packaged theme assets, including the approved Savvy-branded product images and local fonts.

## Required Shopify resources

Theme files do not create Shopify admin records. The following must exist in the store for all routes and commerce actions to resolve:

- 65 products using the handles in `src/catalog.json`, with variants, prices, inventory, descriptions and product media.
- Collections: `all`, `protein-coffee`, `refreshers`, `concentrates`, `creamers`, `syrups`, and `accessories`.
- Pages: `giveaway`, `recipes`, `support`, `reviews`, `affiliate`, `wholesale`, `privacy-choices`, `store-locator`, `newsletter`, `community`, and `media`.
- Blog handle `coffee` and any approved articles.
- Approved refund, privacy and terms policies in Shopify Settings.
- Customer accounts and any subscription/selling-plan app required by the business.
- Approved social URLs, menus, support destination and store-locator data.

The theme uses honest fallbacks when optional merchant data is missing. It does not invent policy text, product facts, inventory, reviews, subscription terms or retail locations.

## Validation

- `npm run theme:build` regenerates the Figma-derived Liquid sections from the committed React source.
- `npm run theme:qa` validates catalog/image packaging, literal asset references, template-section resolution, branding, content handles and Shopify asset-size limits.
- Shopify Theme Check has no new offenses in Savvy files. The remaining nine findings are identical to the untouched upstream Horizon theme: two `applicable_disclosures` compatibility errors and seven pre-existing warnings.
- Deployment uses `shopify theme push --environment staging --nodelete --no-input` and must be followed by a separate pullback comparison.
