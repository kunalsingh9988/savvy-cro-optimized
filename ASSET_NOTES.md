# Savvy image assets

Original design images were retrieved from the user-supplied Figma file. Product packaging and other visible brand marks were edited with the built-in image generation tool. Final web images are stored in `public/assets/savvy-*.webp`; `src/asset-config.json` maps design image references to those files. Hero files use descriptive names; catalog and lifestyle files include their source image index and delivery dimensions.

## Editing prompt

Precise object edit: replace the visible Javvy or Javy branding with Savvy, keeping the original logo style, color, position, scale, perspective, printing finish, framing, product shape, background, people, lighting and other text. Preserve transparency where present. Collages and testimonial thumbnails receive the same brand-only instruction, including mirrored logos.

The desktop hero, mobile hero and product hero were edited separately. Product variants were exported at the original aspect ratios and delivery dimensions as high-quality WebP. Code-native Savvy wordmarks replace the original logo artwork.

AI editing may introduce small differences in photography, lettering and packaging details. The pages use the source design's copy and layout, but regenerated artwork is not an identical pixel copy of the source image.

Individual product pages use 65 higher-resolution `public/assets/savvy-<source-index>-detail.webp` files exported from the existing Savvy image edits. Their committed paths are recorded in `src/catalog.json`. These conversions preserve the edited product image and transparency; no additional product appearance or packaging facts were generated for the detail pages.
