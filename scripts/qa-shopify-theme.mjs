import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const theme = path.join(root, 'theme');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src', 'catalog.json'), 'utf8'));
const failures = [];
const checks = [];

const pass = (name, detail) => checks.push({ name, detail });
const fail = (name, detail) => failures.push({ name, detail });
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else files.push(file);
  }
}

walk(theme);
const textFiles = files.filter(file => /\.(?:liquid|json|css|js)$/.test(file));
const text = textFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const assets = new Set(fs.readdirSync(path.join(theme, 'assets')));

if (catalog.length === 65) pass('catalog', '65 product records');
else fail('catalog', `${catalog.length} product records; expected 65`);

const missingCatalogAssets = [];
for (const product of catalog) {
  for (const key of ['image', 'detailImage']) {
    const name = product[key]?.replace(/^\/assets\//, '');
    if (name && !assets.has(name)) missingCatalogAssets.push(`${product.id}:${key}:${name}`);
  }
}
if (missingCatalogAssets.length) fail('catalog assets', missingCatalogAssets.join(', '));
else pass('catalog assets', 'all product card and detail images packaged');

const literalAssetRefs = [...text.matchAll(/['"]([^'"]+)['"]\s*\|\s*asset_url/g)].map(match => match[1]);
const missingAssetRefs = [...new Set(literalAssetRefs.filter(name => !assets.has(name)))];
if (missingAssetRefs.length) fail('Liquid asset references', missingAssetRefs.join(', '));
else pass('Liquid asset references', `${new Set(literalAssetRefs).size} referenced assets exist`);

for (const templateName of ['index', 'collection', 'product', 'page', 'blog', '404']) {
  const file = path.join(theme, 'templates', `${templateName}.json`);
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\/\*[\s\S]*?\*\//, ''));
  for (const [id, section] of Object.entries(parsed.sections || {})) {
    const sectionFile = path.join(theme, 'sections', `${section.type}.liquid`);
    if (!fs.existsSync(sectionFile)) fail('template sections', `${templateName}:${id} -> ${section.type} is missing`);
  }
}
if (!failures.some(item => item.name === 'template sections')) pass('template sections', 'all custom template section types exist');

const generated = files.filter(file => /\/sections\/sv-(?:home|collection|flagship|story)-/.test(file));
if (generated.length === 42) pass('generated design', '37 logical Figma sections packaged in 42 Shopify-safe files');
else fail('generated design', `${generated.length} generated section files; expected 42`);

const customText = textFiles
  .filter(file => /\/(?:sections|snippets|assets|layout)\/sv-|\/layout\/theme\.liquid$/.test(file))
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\n');
const oldBrand = customText.match(/\bja(?:vvy|vy)\b/gi) || [];
if (oldBrand.length) fail('branding', `${oldBrand.length} legacy brand references`);
else pass('branding', 'no legacy Javvy/Javy text in Savvy implementation');

const expectedPageHandles = ['giveaway', 'recipes', 'support', 'affiliate', 'wholesale', 'privacy-choices', 'reviews', 'store-locator', 'newsletter', 'community', 'media'];
const pageSection = fs.readFileSync(path.join(theme, 'sections', 'sv-page.liquid'), 'utf8');
const missingHandles = expectedPageHandles.filter(handle => !pageSection.includes(`'${handle}'`));
if (missingHandles.length) fail('content routes', missingHandles.join(', '));
else pass('content routes', `${expectedPageHandles.length} footer Page handles implemented`);

const largestAsset = files
  .filter(file => file.startsWith(path.join(theme, 'assets') + path.sep))
  .map(file => ({ file, size: fs.statSync(file).size }))
  .sort((a, b) => b.size - a.size)[0];
if (largestAsset.size > 20 * 1024 * 1024) fail('asset limits', `${path.basename(largestAsset.file)} exceeds 20 MB`);
else pass('asset limits', `${assets.size} assets; largest ${(largestAsset.size / 1024 / 1024).toFixed(2)} MB`);

console.log(JSON.stringify({ ok: failures.length === 0, checks, failures }, null, 2));
if (failures.length) process.exit(1);
