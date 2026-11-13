// Generates theme/sections/sv-*.liquid from the React design sections.
// Run: node scripts/build-theme.mjs
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const THEME = path.join(ROOT, 'theme', 'sections');
const layouts = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/layouts.json'), 'utf8'));
const assetCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/asset-config.json'), 'utf8'));

// layout positions rendered natively (header/hero/social/footer)
const NATIVE = {
  home: { d: new Set(['1359', '11', '1215', '1233']), m: new Set(['2607', '1433', '2517', '2533']) },
  collection: { d: new Set(['4327', '4198']), m: new Set(['6126', '6022']) },
  product: { d: new Set(['8648', '8521']), m: new Set(['11125', '11023']) },
};

const ANCHORS = {
  '2698': 'protein-coffee', '3097': 'refreshers', '3217': 'concentrates', '3595': 'creamers',
  '3748': 'syrups', '3838': 'accessories', '4438': 'protein-coffee', '4864': 'refreshers',
  '4992': 'concentrates', '5394': 'creamers', '5556': 'syrups', '5652': 'accessories',
  '7153': 'reviews', '9675': 'reviews',
};

const REVIEWS = {
  '7153': { list: ['7154', '7291', '7430', '7444', '7508', '7572', '7636', '7700', '7764', '7828', '7892', '7956', '8020', '8084'], intro: 1 },
  '9675': { list: ['9676', '9813', '9938', '9952', '10016', '10080', '10144', '10208', '10273', '10337', '10401', '10465', '10529', '10593'], intro: 1 },
};

const SAVINGS = { '2664': { id: '2693', h: 52 }, '4404': { id: '4433', h: 49 } };

// story subset for non-flagship detail pages (desktop, mobile)
const STORY = [['6815', '9331'], ['8376', '10879'], ['6865', '9383'], ['6963', '9483'], ['7093', '9614'], ['7142', '9664']];

const server = await createServer({
  root: ROOT,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
const { ShopContext } = await server.ssrLoadModule('/src/ui.jsx');

function ctx(page) {
  return {
    ...assetCfg, page,
    navigate: () => {}, scrollCarousel: () => {}, newsletterDraft: '',
    openNewsletter: () => {}, addItem: () => {}, notify: () => {},
    items: [], setItems: () => {}, setCart: () => {}, openInfo: () => {},
    action: () => {}, bundle: {}, flavorButtons: {}, gallery: 0,
    changeBundle: () => {},
  };
}

const cache = new Map();
const dimsCache = new Map();
function imageDims(name) {
  if (dimsCache.has(name)) return dimsCache.get(name);
  let dims = null;
  const m = name.match(/(\d+)x(\d+)\.\w+$/);
  if (m) dims = { w: m[1], h: m[2] };
  else {
    const file = path.join(ROOT, 'public', 'assets', name);
    try {
      const out = execSync(`sips -g pixelWidth -g pixelHeight ${JSON.stringify(file)}`, { encoding: 'utf8' });
      const w = out.match(/pixelWidth:\s*(\d+)/), h = out.match(/pixelHeight:\s*(\d+)/);
      if (w && h) dims = { w: w[1], h: h[1] };
    } catch { /* asset missing or unsupported */ }
  }
  dimsCache.set(name, dims);
  return dims;
}

async function renderSection(id, page) {
  const key = id + ':' + page;
  if (cache.has(key)) return cache.get(key);
  let mod;
  try {
    mod = await server.ssrLoadModule(`/src/sections/Section${id}.jsx`);
  } catch (e) {
    console.error(`Section${id} failed to load:`, e.message);
    cache.set(key, '');
    return '';
  }
  let html = renderToStaticMarkup(
    React.createElement(ShopContext.Provider, { value: ctx(page) }, React.createElement(mod.default))
  );
  html = html
    .replace(/\/assets\/([\w.-]+)/g, "{{ '$1' | asset_url }}")
    .replace(/href="\/"/g, 'href="{{ routes.root_url }}"')
    .replace(/href="\/collections\/all(#[^"]+)?"/g, (_m, hash = '') => `href="{{ routes.all_products_collection_url }}${hash}"`)
    .replace(/href="\/collections\/([a-z0-9-]+)"/g, (_m, handle) => `href="{{ collections['${handle}'].url | default: routes.collections_url }}"`)
    .replace(/href="\/collections"/g, 'href="{{ routes.collections_url }}"')
    .replace(/href="\/account"/g, 'href="{{ routes.account_url }}"')
    .replace(/<img([^>]*?)\/>/g, '<img$1>')
    .replace(/<img([^>]*?)src="{{ '([\w.-]+)' \| asset_url }}"([^>]*?)>/g, (m, a, name, b) => {
      const dims = imageDims(name);
      const attrs = dims ? ` width="${dims.w}" height="${dims.h}"` : '';
      const lazy = /loading=/.test(a + b) ? '' : ' loading="lazy" decoding="async"';
      return `<img${a}src="{{ '${name}' | asset_url }}"${b}${attrs}${lazy}>`;
    });
  cache.set(key, html);
  return html;
}

async function sectionInner(id, page, mobile) {
  if (REVIEWS[id]) {
    const { list, intro } = REVIEWS[id];
    const parts = [];
    for (let i = 0; i < list.length; i++) {
      const h = await renderSection(list[i], page);
      parts.push(`<div class="${i < intro ? 'reviews-intro' : 'reviews-inner'}">${h}</div>`);
    }
    return `<div class="reviews-section">${parts.join('')}</div>`;
  }
  let inner = await renderSection(id, page);
  if (SAVINGS[id]) {
    const s = await renderSection(SAVINGS[id].id, page);
    inner += `<div class="collection-savings" style="height:calc(${SAVINGS[id].h}px*var(--design-scale))">${s}</div>`;
  }
  return inner;
}

function canvasVar(w, base, mobile) {
  if (mobile) return `--sv-canvas:calc(100vw * ${(w / base).toFixed(6)})`;
  if (w < base) return `--sv-canvas:min(100vw - 64px,1760px)`;
  return `--sv-canvas:calc(min(100vw,1920px) * ${(w / base).toFixed(6)})`;
}

async function variantMarkup(entry, page, mobile, marginOverride) {
  const base = mobile ? 390 : 1440;
  const anchor = ANCHORS[entry.id] ? ` id="${ANCHORS[entry.id]}" aria-label="${ANCHORS[entry.id]}"` : ` aria-label="${entry.name}"`;
  const margin = marginOverride !== undefined ? `margin-top:${marginOverride}px` : `--sv-gap:${entry.gap.toFixed(2)}px`;
  const inner = await sectionInner(entry.id, page, mobile);
  return `<section class="design-section section-${entry.id} ${mobile ? 'sv-mobile' : 'sv-desktop'}"${anchor} style="--sv-h:${entry.h.toFixed(2)}px;--sv-w:${entry.w}px;${canvasVar(entry.w, base, mobile)};${margin}"><div class="section-canvas">${inner}</div></section>`;
}

// pair desktop + mobile layout entries by position; entries are independent
// (ids differ) so we align them by index over the filtered design set.
function pairLayouts(dList, mList, nativeD, nativeM) {
  const d = dList.filter(n => !nativeD.has(n.id));
  const m = mList.filter(n => !nativeM.has(n.id));
  const count = Math.max(d.length, m.length);
  const pairs = [];
  for (let i = 0; i < count; i++) pairs.push({ d: d[i] || null, m: m[i] || null });
  return pairs;
}

const SPLIT_LIMIT = 140_000;

function sectionFile(label, condOpen, body, condClose, name) {
  return `{% comment %}\n  Design section. Generated from the Savvy Figma build (src/sections/).\n  ${label}\n{% endcomment %}\n${condOpen}${body}${condClose}\n\n{% schema %}\n{\n  "name": "${name}",\n  "class": "sv-design",\n  "settings": []\n}\n{% endschema %}\n`;
}

async function emitPage(page, dKey, mKey, filePrefix, schemaPrefix, condition) {
  const pairs = pairLayouts(layouts[dKey], layouts[mKey], NATIVE[page].d, NATIVE[page].m);
  let n = 0;
  const emitted = [];
  for (const pair of pairs) {
    n++;
    const label = pair.d?.name || pair.m?.name || 'Section';
    const num = String(n).padStart(2, '0');
    const condOpen = condition ? `{% if ${condition} %}\n` : '';
    const condClose = condition ? `\n{% endif %}` : '';
    const dBody = pair.d ? await variantMarkup(pair.d, page, false) : '';
    const mBody = pair.m ? await variantMarkup(pair.m, page, true) : '';
    const meta = `Desktop: #${pair.d?.id ?? '-'} · Mobile: #${pair.m?.id ?? '-'} · Region: ${label}`;
    const combined = condOpen.length + dBody.length + mBody.length;
    if (combined > SPLIT_LIMIT && pair.d && pair.m) {
      fs.writeFileSync(path.join(THEME, `${filePrefix}-${num}a.liquid`),
        sectionFile(meta + ' (desktop)', condOpen, dBody, condClose, `${schemaPrefix} ${num}a`));
      fs.writeFileSync(path.join(THEME, `${filePrefix}-${num}b.liquid`),
        sectionFile(meta + ' (mobile)', condOpen, mBody, condClose, `${schemaPrefix} ${num}b`));
      emitted.push(`${filePrefix}-${num}a`, `${filePrefix}-${num}b`);
    } else {
      fs.writeFileSync(path.join(THEME, `${filePrefix}-${num}.liquid`),
        sectionFile(meta, condOpen, dBody + mBody, condClose, `${schemaPrefix} ${num}`));
      emitted.push(`${filePrefix}-${num}`);
    }
  }
  emitPage.emitted = Object.assign(emitPage.emitted || {}, { [filePrefix]: emitted });
  return n;
}

// compute gaps (y - prevBottom) per layout list
for (const list of Object.values(layouts)) {
  let prev = 0;
  for (const n of list) { n.gap = n.y - prev; prev = n.y + n.h; }
}

let total = 0;
total += await emitPage('home', 'homeD', 'homeM', 'sv-home', 'SV Home');
total += await emitPage('collection', 'collectionD', 'collectionM', 'sv-collection', 'SV Collection', "collection.handle == 'all'");

// flagship product page = full product layout minus header/footer
total += await emitPage('product', 'productD', 'productM', 'sv-flagship', 'SV Product', "product.handle == 'protein-coffee'");

// story subset for other protein-coffee detail pages
{
  const dList = layouts.productD, mList = layouts.productM;
  const dMap = Object.fromEntries(dList.map(x => [x.id, x]));
  const mMap = Object.fromEntries(mList.map(x => [x.id, x]));
  let n = 0;
  for (const [dId, mId] of STORY) {
    n++;
    const first = n === 1;
    const d = dMap[dId], m = mMap[mId];
    let body = '';
    if (d) body += await variantMarkup(d, 'detail', false, first ? 48 : 0);
    if (m) body += await variantMarkup(m, 'detail', true, first ? 48 : 0);
    const file = `{% comment %}\n  Design story section (Protein Coffee PDP). Generated from src/sections/.\n{% endcomment %}\n{% assign sv_pc = product.collections | map: 'handle' %}{% if sv_pc contains 'protein-coffee' and product.handle != 'protein-coffee' %}\n${body}\n{% endif %}\n\n{% schema %}\n{\n  "name": "SV Story ${String(n).padStart(2, '0')}",\n  "class": "sv-design",\n  "settings": []\n}\n{% endschema %}\n`;
    fs.writeFileSync(path.join(THEME, `sv-story-${String(n).padStart(2, '0')}.liquid`), file);
    total++;
  }
}

await server.close();
console.log('Generated', total, 'sections');
