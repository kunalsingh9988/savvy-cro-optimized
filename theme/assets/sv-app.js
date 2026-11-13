// Savvy storefront interactions — ports the prototype's delegated behavior
// (bundle builder, review expanders, accordions, carousels, overlays) onto the
// Shopify theme, wiring commerce actions to the real cart + drawer.
import { CartLinesUpdateEvent } from '@shopify/events';

const PRODUCTS = window.SAVVY_PRODUCTS || [];
const GALLERY = window.SAVVY_GALLERY || [];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = cents => '$' + (cents / 100).toFixed(2);

/* ---------- product lookup ---------- */
const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const normMap = new Map(PRODUCTS.map(p => [norm(p.title), p]));
const flavorIndex = PRODUCTS.map(p => ({ p, key: norm(p.title.replace(/\s*(protein coffee|protein refresher|coffee concentrate|protein creamer|coffee syrup|syrup|tumbler|bottle|hoodie|hat|spoon|frother|booklet|pack)$/i, '') ) }));
function findProduct(name) {
  const n = norm(name);
  if (!n) return null;
  return normMap.get(n) || flavorIndex.find(f => f.key && (f.key === n || norm(f.p.title).startsWith(n) || n.startsWith(f.key)))?.p || null;
}
function findCard(el) {
  let x = el.parentElement;
  while (x && x !== document.body) {
    if (x.querySelector('img') && x.textContent.length > 18 && x.textContent.length < 700) return x;
    x = x.parentElement;
  }
  return el.parentElement;
}
function productInfo(el) {
  const card = findCard(el);
  const img = card.querySelector('img');
  const alt = img?.getAttribute('alt');
  let p = alt && findProduct(alt);
  if (!p) {
    const candidates = $$('p', card).map(n => n.textContent.trim());
    for (const text of candidates) {
      if (text.length < 4 || /^(Add|Quick|NEW|BEST|20%|−|\+|\d|Sold Out)/.test(text)) continue;
      p = findProduct(text);
      if (p) break;
    }
  }
  return { card, product: p, image: img?.getAttribute('src') };
}

/* ---------- toast + modal ---------- */
let toastTimer;
function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 3500);
}
function overlay(panelClass) {
  const o = document.createElement('div');
  o.className = 'overlay';
  const close = () => { o.remove(); document.body.style.overflow = ''; };
  o.addEventListener('click', e => { if (e.target === o) close(); });
  o.close = close;
  const key = e => { if (e.key === 'Escape') { close(); removeEventListener('keydown', key); } };
  addEventListener('keydown', key);
  document.body.style.overflow = 'hidden';
  return o;
}
function infoModal(title, body, image) {
  const o = overlay();
  o.classList.add('modal-overlay');
  o.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true"><button class="close-button" aria-label="Close dialog">×</button><h2>${title}</h2><p>${body}</p>${image ? `<img class="customer-photo-preview" src="${image}" alt="">` : ''}<button class="primary">Close</button></div>`;
  o.querySelectorAll('button').forEach(b => b.addEventListener('click', o.close));
  document.body.appendChild(o);
}

/* ---------- menu drawer ---------- */
function openMenu() {
  const links = $$('.nav-bar nav a').map(a => `<a href="${a.getAttribute('href')}">${a.textContent}</a>`).join('');
  const o = overlay();
  o.innerHTML = `<aside class="overlay-panel menu-panel" role="dialog" aria-modal="true" aria-label="Navigation"><button class="close-button" aria-label="Close menu">×</button>${$('.home-logo')?.innerHTML || ''}${links}</aside>`;
  o.querySelector('.close-button').addEventListener('click', o.close);
  o.querySelectorAll('a').forEach(a => a.addEventListener('click', o.close));
  document.body.appendChild(o);
}

/* ---------- cart ---------- */
function updateCount(n) {
  $$('[data-sv-cart-count]').forEach(el => { el.textContent = n; el.hidden = !n; });
  $$('.cart-button').forEach(b => b.setAttribute('aria-label', `Open cart (${n} items)`));
}
function openCart() {
  const d = document.getElementById('cart-drawer');
  if (d && typeof d.open === 'function') { if (!d.isOpen) d.open(); }
  else location.href = '/cart';
}
async function addToCart(items, { silent = false } = {}) {
  items = items.filter(i => i.id);
  if (!items.length) { toast('That product isn’t available yet.'); return false; }
  const promise = CartLinesUpdateEvent.createPromise();
  document.dispatchEvent(new CartLinesUpdateEvent({
    action: 'add',
    context: 'sv',
    lines: items.map(i => ({ merchandiseId: `gid://shopify/ProductVariant/${i.id}`, quantity: i.quantity })),
    promise: promise.promise,
  }));
  try {
    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items, sections: 'cart-drawer-section,cart-section' }),
    });
    const data = await res.json();
    const cart = await (await fetch('/cart.js')).json();
    promise.resolve({ cart, detail: { sections: data.sections, source: 'sv-app' } });
    updateCount(cart.item_count);
    if (!silent) openCart();
    return true;
  } catch (e) {
    promise.reject(e);
    toast('Couldn’t add that to your cart — please try again.');
    return false;
  }
}

/* ---------- bundle builder (flagship PDP) ---------- */
const bundle = {};
let subscription = true;
const TIER = [34.95, 32.95, 30.95, 24.95];
function bundleCount() { return Object.values(bundle).reduce((a, i) => a + i.qty, 0); }
function eachPrice() { const n = bundleCount(); return n >= 4 ? 24.95 : n === 3 ? 30.95 : n === 2 ? 32.95 : 34.95; }
function refreshBundleUI() {
  const count = bundleCount();
  $$('[data-name="Button"]').forEach(el => {
    const p = el.querySelector('p');
    if (!p) return;
    const flavor = el.dataset.flavor;
    if (flavor && bundle[flavor]) {
      el.classList.add('added-button');
      return;
    }
    if (/Select at least|Add \d+ bag/.test(p.textContent)) {
      const each = subscription ? eachPrice() : 39.95;
      const val = count ? `Add ${count} ${count === 1 ? 'bag' : 'bags'} — $${(count * each).toFixed(2)}` : 'Select at least 1 bag';
      p.textContent = val;
      el.classList.toggle('bundle-ready', count > 0);
      el.setAttribute('aria-disabled', String(!count));
    }
  });
}
function toStepper(btn, flavor) {
  const box = document.createElement('div');
  box.className = btn.className + ' bundle-quantity';
  box.dataset.flavor = flavor;
  box.innerHTML = `<button type="button" aria-label="Remove one ${flavor}">−</button><output>${bundle[flavor].qty}</output><button type="button" aria-label="Add one ${flavor}">+</button>`;
  btn.replaceWith(box);
}
document.addEventListener('click', e => {
  const stepBtn = e.target.closest('.bundle-quantity button');
  if (stepBtn) {
    const box = stepBtn.closest('.bundle-quantity');
    const flavor = box.dataset.flavor;
    const delta = stepBtn.textContent.trim() === '+' ? 1 : -1;
    bundle[flavor].qty = Math.max(0, bundle[flavor].qty + delta);
    if (!bundle[flavor].qty) { delete bundle[flavor]; box.outerHTML = box.dataset.origHtml; }
    else box.querySelector('output').textContent = bundle[flavor].qty;
    refreshBundleUI();
    e.stopPropagation();
    return;
  }
});

/* ---------- destination routing (ports routes.js) ---------- */
const DESTINATIONS = {
  'Home': '/', 'Products': '/collections/all', 'Shop All': '/collections/all', 'Discover': '/collections/all',
  'Shop Now': '/collections/all', 'Shop Best Sellers': '/collections/all',
  'Build Your Bundle': '/products/protein-coffee', 'Subscribe & Save': '/products/protein-coffee#purchase-plan',
  'Protein Coffee': '/products/protein-coffee', 'Shop Protein Coffee': '/products/protein-coffee',
  'Protein Refreshers': '/collections/refreshers', 'Shop Protein Refreshers': '/collections/refreshers',
  'Coffee Concentrate': '/collections/concentrates', 'Protein Creamer': '/collections/creamers',
  'Syrups': '/collections/syrups', 'Coffee Syrup': '/collections/syrups',
  'Accessories': '/collections/accessories', 'Shop All Accessories': '/collections/accessories',
  'Giveaway': '/pages/giveaway', 'Recipes': '/pages/recipes', 'Blog': '/blogs/coffee',
  'Become an Affiliate': '/pages/affiliate', 'Wholesale': '/pages/wholesale',
  'Help': '/pages/support', 'Support': '/pages/support', 'Reviews': '/pages/reviews',
  'Find a Store': '/pages/store-locator',
  'Returns & Refunds': '/policies/refund-policy', 'Terms of Sale': '/policies/terms-of-service',
  'Privacy Policy': '/policies/privacy-policy',
  'Do Not Sell or Share My Personal Information': '/pages/privacy-choices', 'Account': '/account',
  'Instagram': '/pages/community#instagram', 'Facebook': '/pages/community#facebook',
  'TikTok': '/pages/community#tiktok', 'Pinterest': '/pages/community#pinterest',
  'Twitter': '/pages/community#twitter', 'YouTube': '/pages/community#youtube',
  'Snapchat': '/pages/community#snapchat',
};
function destinationFor(label) {
  const text = (label || '').replace(/\s+/g, ' ').trim();
  if (DESTINATIONS[text]) return DESTINATIONS[text];
  if (/Home Page/.test(text)) return '/';
  if (/AVAILABLE NOW|Cinnamon Roll/.test(text)) return '/products/cinnamon-roll-protein-creamer';
  if (/Review/i.test(text)) return '/pages/reviews';
  if (/recipe/i.test(text)) return '/pages/recipes';
  if (/Mega Deal|Shop All|Discover/i.test(text)) return '/collections/all';
  const product = findProduct(text);
  if (product) return product.url;
  if (/Creamer/.test(text)) return '/collections/creamers';
  if (/Refresher/.test(text)) return '/collections/refreshers';
  if (/Concentrate/.test(text)) return '/collections/concentrates';
  if (/Syrup/.test(text)) return '/collections/syrups';
  if (/Accessories/.test(text)) return '/collections/accessories';
  if (/Coffee/.test(text)) return '/products/protein-coffee';
  return null;
}

/* ---------- delegated design actions ---------- */
const EXPAND_CATEGORY = { '145:91': 'all', '145:1515': 'all', '145:107': 'protein-coffee', '145:1532': 'protein-coffee', '145:123': 'concentrates', '145:139': 'creamers', '145:155': 'syrups' };
const BENEFIT_COPY = {
  '145:2004': 'Crafted with better-for-you ingredients, our coffee delivers guilt-free indulgence, offering crave-able flavors without compromise.',
  '145:2010': 'Discover a new way to enjoy iced coffee with our best-selling Coffee Concentrate and Protein Coffee blend.',
  '145:2016': 'Enjoy café-quality coffee at home. Make iced coffee in seconds and effortlessly customize your perfect cup.',
  '145:615': 'Crafted with better-for-you ingredients, our coffee delivers guilt-free indulgence, offering crave-able flavors without compromise.',
  '145:626': 'Discover a new way to enjoy iced coffee with our best-selling Coffee Concentrate and Protein Coffee blend.',
  '145:637': 'Enjoy café-quality coffee at home. Make iced coffee in seconds and effortlessly customize your perfect cup.',
};
const isProductPage = () => !!$('.section-6209, .section-8767');

function faqAnswerFor(q) {
  if (q.includes('What is Protein Coffee')) return 'Savvy Protein Coffee combines real coffee with premium whey protein, prebiotics and MCTs. Customize your favorite iced coffee while working toward your protein goals.';
  if (q.includes('Dairy Free')) return 'Protein Coffee contains whey protein, which is derived from milk. Check the packaging for the complete ingredient and allergen information.';
  if (q.includes('prepare')) return 'Mix into your favorite iced coffee, stir or shake, and enjoy. Follow the instructions on the packaging for your chosen flavor.';
  return 'Please check your selected flavor’s packaging for its ingredients, nutrition information, preparation instructions and best-by date.';
}
function growSection(el) {
  const section = el.closest('.design-section');
  if (!section) return;
  if (!section.dataset.origHeight) section.dataset.origHeight = getComputedStyle(section).height;
  const extra = $$('.faq-answer:not([hidden]), .benefit-answer:not([hidden]), .review-expanded:not([hidden])', section).reduce((h, a) => h + a.getBoundingClientRect().height, 0);
  section.style.height = `calc(${section.dataset.origHeight} + ${extra}px)`;
}

document.addEventListener('click', e => {
  const t = e.target;

  // native controls
  if (t.closest('[data-sv-menu-open]')) { openMenu(); return; }
  if (t.closest('[data-sv-cart-open]')) { openCart(); return; }

  // benefit / faq accordions (design sections)
  const benefit = t.closest(Object.keys(BENEFIT_COPY).map(id => `[data-node-id="${id}"]`).join(','));
  if (benefit) {
    let answer = benefit.parentElement.querySelector('.benefit-answer');
    if (!answer) { answer = document.createElement('p'); answer.className = 'benefit-answer'; answer.textContent = BENEFIT_COPY[benefit.dataset.nodeId]; benefit.parentElement.appendChild(answer); }
    else answer.hidden = !answer.hidden;
    benefit.setAttribute('aria-expanded', String(!answer.hidden));
    growSection(benefit);
    return;
  }
  const faqRow = t.closest('[data-name="HorizontalBorder"]');
  if (faqRow && faqRow.closest('[data-node-id="145:8087"],[data-node-id="145:10596"]')) {
    const open = faqRow.classList.toggle('faq-open');
    let answer = faqRow.querySelector('.faq-answer');
    if (!answer) {
      answer = document.createElement('p');
      answer.className = 'faq-answer';
      answer.textContent = faqAnswerFor(faqRow.textContent);
      faqRow.appendChild(answer);
    }
    answer.hidden = !open;
    faqRow.querySelector('button')?.setAttribute('aria-expanded', String(open));
    growSection(faqRow);
    return;
  }
  if (faqRow) return; // other horizontal borders are inert

  // plan radios
  const radio = t.closest('[role=radio]');
  if (radio && (radio.getAttribute('aria-label') === 'Subscribe & Save' || radio.getAttribute('aria-label') === 'One-time Purchase')) {
    subscription = radio.getAttribute('aria-label') === 'Subscribe & Save';
    $$('[role=radio]').forEach(r => {
      const on = r.getAttribute('aria-label') === radio.getAttribute('aria-label');
      if (on || r.getAttribute('aria-label') === 'Subscribe & Save' || r.getAttribute('aria-label') === 'One-time Purchase') r.setAttribute('aria-checked', String(on));
    });
    toast(radio.getAttribute('aria-label') + ' selected');
    refreshBundleUI();
    return;
  }

  // nutritional info
  const border = t.closest('[data-name="Border"]');
  if (border && /Nutritional Information/.test(border.textContent)) {
    infoModal('Nutritional Information', 'Choose a flavor in your bundle to view its product details. Complete nutrition facts are printed on the product packaging.');
    return;
  }

  const btn = t.closest('button, [data-node-id][role=button]');
  if (!btn) return;
  const label = btn.textContent.trim();
  const name = btn.dataset.name || '';
  const nodeId = btn.dataset.nodeId || '';

  // gallery prev/next
  if (nodeId === '145:8869' || nodeId === '145:8873') {
    const dir = nodeId === '145:8869' ? -1 : 1;
    const section = btn.closest('.design-section') || document;
    const img = $$('img', section).find(i => GALLERY.some(g => i.src.includes(g.name)));
    if (img && GALLERY.length) {
      const cur = GALLERY.findIndex(g => img.src.includes(g.name));
      const next = GALLERY[(cur + dir + GALLERY.length) % GALLERY.length];
      img.src = next.url;
    }
    return;
  }

  if (/Customer-uploaded image/i.test(name)) {
    const img = btn.querySelector('img');
    if (img) infoModal('Customer photo', img.alt || 'Customer photo included in the supplied design.', img.src);
    return;
  }
  if (/play/i.test(name) || /Customer-uploaded video/i.test(name) || (btn.closest('.section-6815,.section-9331') && !label)) { location.href = '/pages/media'; return; }

  // reviews
  const review = btn.closest('.reviews-inner');
  if (review && /^Read (More|Less)$/i.test(label)) {
    let full = review.querySelector('.review-expanded');
    if (!full) {
      const ps = $$('p', review.firstElementChild).map(p => p.textContent);
      const end = ps.findIndex(t => /Read More/i.test(t));
      full = document.createElement('div');
      full.className = 'review-expanded';
      full.innerHTML = `<strong>Full review from ${ps[0]}</strong><p>${ps.slice(4, end < 0 ? undefined : end).join(' ')}</p>`;
      review.appendChild(full);
    } else full.hidden = !full.hidden;
    btn.setAttribute('aria-expanded', String(!full.hidden));
    const p = btn.querySelector('p');
    if (p) p.textContent = full.hidden ? 'Read More' : 'Read Less';
    growSection(review);
    return;
  }
  if (review && /^[01]$/.test(label)) {
    const controls = $$('button', review).filter(b => b.querySelector('p') && /^[01]$/.test(b.querySelector('p').textContent));
    const index = controls.indexOf(btn);
    const same = review.dataset.vote === String(index);
    review.dataset.vote = same ? '' : String(index);
    controls.forEach((b, i) => { b.setAttribute('aria-pressed', String(!same && i === index)); b.querySelector('p').textContent = !same && i === index ? '1' : '0'; });
    toast(same ? 'Your local feedback was removed.' : 'Feedback marked for this visit.');
    return;
  }
  if (/^\([\d,]+\)$/.test(label)) { document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }); return; }

  // quick-add icon buttons
  if (/Form/.test(name) && !label) {
    const group = btn.closest('[data-name="Group"]') || btn.closest('[data-name="Group:margin"]');
    if (group) {
      const { product } = productInfo(group);
      if (product) addToCart([{ id: product.variantId, quantity: 1 }]).then(ok => ok && toast(product.title + ' added to cart'));
      else toast('That product isn’t available yet.');
      return;
    }
  }

  if (/Open Cart/i.test(name)) { openCart(); return; }
  if (/Expand category/i.test(name)) { location.href = '/collections/' + (EXPAND_CATEGORY[nodeId] || 'all'); return; }

  // add buttons
  if (/^Add\s*\+|^Quick Add|^Subscribe\s*\+/.test(label)) {
    const { product, card } = productInfo(btn);
    if (product && product.available === false) { toast(product.title + ' is sold out. Choose another flavor.'); return; }
    if (isProductPage() && /^Add\s*\+/.test(label) && !label.includes('$')) {
      const flavor = product ? (product.flavor || product.title) : $$('p', card).map(p => p.textContent).find(x => x.length > 2) || 'Flavor';
      bundle[flavor] = { product, qty: (bundle[flavor]?.qty || 0) + 1 };
      btn.dataset.flavor = flavor;
      if (!btn.dataset.origHtml) btn.dataset.origHtml = btn.outerHTML;
      toStepper(btn, flavor);
      refreshBundleUI();
      return;
    }
    if (product) addToCart([{ id: product.variantId, quantity: 1 }]).then(ok => ok && toast(product.title + ' added to cart'));
    else toast('That product isn’t available yet.');
    return;
  }

  // bundle CTA
  if (/Select at least|Add .*bag|Add to cart/i.test(label)) {
    const count = bundleCount();
    if (!count) { toast('Choose at least one flavor to build your bundle.'); return; }
    const items = [];
    const missing = [];
    for (const [flavor, entry] of Object.entries(bundle)) {
      if (entry.product) items.push({ id: entry.product.variantId, quantity: entry.qty });
      else missing.push(flavor);
    }
    if (missing.length) toast(`${missing.join(', ')} ${missing.length > 1 ? 'aren’t' : 'isn’t'} available in the live catalog yet.`);
    if (items.length) addToCart(items);
    return;
  }

  if (/Sign Up/i.test(label)) {
    const input = btn.closest('[data-name="Form"]')?.querySelector('input') || $('.design-email');
    if (!input?.value || !input.checkValidity()) { input?.reportValidity(); input?.focus(); return; }
    fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ form_type: 'customer', 'contact[email]': input.value, 'contact[tags]': 'newsletter' }),
    }).then(r => infoModal('Thank you!', r.ok ? 'You’re on the list — watch your inbox for Savvy deals.' : 'Something went wrong. Please try again.'));
    return;
  }

  if (/Write a Review/i.test(label)) { location.href = '/pages/reviews#review-draft'; return; }
  if (/Ask a Question/i.test(label)) { location.href = '/pages/support#request'; return; }
  if (/Show more/i.test(label)) { location.href = '/pages/reviews'; return; }
  if (/Read more/i.test(label)) { location.href = '/blogs/coffee'; return; }

  // carousel fallback for unlabeled buttons inside design sections
  const region = btn.closest('[data-name="Region"]') || btn.closest('section');
  if (region && btn.closest('.design-section')) {
    const track = $$('div', region).filter(n => n.scrollWidth > n.clientWidth + 50 && n.clientWidth > 150).sort((a, b) => b.scrollWidth - a.scrollWidth)[0];
    if (track) {
      track.style.overflowX = 'auto';
      const prev = /Previous|back/i.test(name) || btn.getBoundingClientRect().left < region.getBoundingClientRect().left + region.clientWidth / 2;
      track.scrollBy({ left: (prev ? -1 : 1) * Math.min(track.clientWidth, 355), behavior: 'smooth' });
      return;
    }
  }
});

// product-link images + catch-all label routing (prototype's destinationFor)
document.addEventListener('click', e => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = e.target.closest('a[href]');
  if (link && !link.closest('.design-section')) return; // native links behave normally
  const prod = e.target.closest('[data-product-link]');
  if (prod) {
    const card = findCard(prod);
    const p = card && productInfo(card).product;
    if (p?.url) { e.preventDefault(); location.href = p.url; }
    return;
  }
  if (link) return; // design links already have real hrefs
  const title = e.target.closest('a[data-product-title]');
  if (title) { e.preventDefault(); location.href = title.getAttribute('href'); return; }
  const node = e.target.closest('.design-section [data-node-id], .design-section [data-name]');
  if (!node || e.target.closest('[role=radio],[data-sv-menu-open],[data-sv-cart-open],input,select,textarea')) return;
  const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
  if (text.length < 3 || text.length > 60) return;
  const dest = destinationFor(text);
  if (dest) location.href = dest;
});

/* ---------- store locator ---------- */
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-sv-store-search]');
  if (!f) return;
  e.preventDefault();
  const done = f.parentElement.querySelector('[data-sv-store-done]');
  if (done) done.hidden = false;
});

/* ---------- enhancement pass (roles, links, aria) ---------- */
function enhance(root = document) {
  // plan radios
  $$('p', root).forEach(p => {
    if (p.textContent === 'Subscribe & Save' || p.textContent === 'One-time Purchase') {
      const c = p.closest('[data-name="Border"],[data-name="Overlay+Border+Shadow"]');
      if (c) {
        if (p.textContent === 'Subscribe & Save') c.parentElement.id = 'purchase-plan';
        c.setAttribute('role', 'radio');
        c.setAttribute('tabindex', '0');
        c.setAttribute('aria-label', p.textContent);
        c.setAttribute('aria-checked', String(subscription === (p.textContent === 'Subscribe & Save')));
      }
    }
  });
  // first heading role
  const h = $('h1,[data-name="Heading 1"]', root) || $('[data-name="Heading 2"]', root);
  if (h && !h.hasAttribute('role')) { h.setAttribute('role', 'heading'); h.setAttribute('aria-level', '1'); }
  // benefit roles
  Object.keys(BENEFIT_COPY).forEach(id => {
    $$(`[data-node-id="${id}"]`, root).forEach(el => {
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      el.style.cursor = 'pointer';
      if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    });
  });
  // product cards in design sections: image + title link to the product page
  $$('button[data-node-id]', root).forEach(button => {
    if (!/^(Add|Quick Add|Sold Out|Subscribe)/.test(button.textContent.trim())) return;
    const card = findCard(button);
    if (!card || card.dataset.svLinked) return;
    const { product } = productInfo(card);
    if (!product) return;
    card.dataset.svLinked = '1';
    const img = card.querySelector('img');
    if (img && !img.closest('a')) {
      img.dataset.productLink = 'true';
      img.tabIndex = 0;
      img.setAttribute('role', 'link');
      img.setAttribute('aria-label', 'View ' + product.title);
      img.style.cursor = 'pointer';
    }
    $$('p', card).forEach(p => {
      const text = p.textContent.trim();
      if (text.length < 4 || p.closest('a') || !product.title.toLowerCase().includes(text.toLowerCase())) return;
      const a = document.createElement('a');
      a.href = product.url;
      a.dataset.productTitle = 'true';
      a.textContent = text;
      p.replaceChildren(a);
    });
  });
  // gallery +- steppers inside PDP flavor cards are visual only
  $$('.section-6209 button[data-node-id],.section-8767 button[data-node-id]', root).forEach(b => {
    if (/^[+-]$/.test(b.textContent.trim())) { b.disabled = true; b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); }
  });
  // review helpfulness buttons
  $$('.reviews-inner', root).forEach(review => {
    $$('button', review).filter(b => b.querySelector('p') && /^[01]$/.test(b.querySelector('p').textContent)).forEach((b, i) => {
      if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', i === 0 ? 'Mark review helpful for this visit' : 'Mark review not helpful for this visit');
    });
  });
  // quick-add aria labels
  $$('button[data-name="Form → Button"]', root).forEach(b => {
    const group = b.closest('[data-name="Group"]');
    const { product } = group ? productInfo(group) : {};
    if (product) b.setAttribute('aria-label', 'Quick add ' + product.title);
  });
}
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=radio],[role=button]')) {
    e.preventDefault();
    e.target.click();
  }
});

/* ---------- carousel controls ---------- */
function carouselTrack(el) {
  const region = el.closest('[data-name="Region"]') || el.closest('.design-section');
  if (!region) return null;
  return $$('div', region)
    .filter(n => n.clientWidth >= region.clientWidth * 0.5 && n.scrollWidth > n.clientWidth + 50 && $$('[data-name="Group"]', n).length > 1)
    .sort((a, b) => b.scrollWidth - a.scrollWidth)[0] || null;
}
document.addEventListener('click', e => {
  const control = e.target.closest('[data-carousel-direction]');
  if (!control) return;
  const track = carouselTrack(control);
  if (!track) return;
  track.classList.add('scrollable-products');
  const max = track.scrollWidth - track.clientWidth;
  const step = Math.min(track.clientWidth * 0.85, 400);
  const dir = Number(control.dataset.carouselDirection);
  const next = dir > 0 ? (track.scrollLeft >= max - 2 ? 0 : Math.min(max, track.scrollLeft + step)) : (track.scrollLeft <= 2 ? max : Math.max(0, track.scrollLeft - step));
  track.scrollTo({ left: next, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});
document.addEventListener('keydown', e => {
  const control = e.target.closest?.('[data-carousel-direction]');
  if (!control || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
  e.preventDefault();
  control.dataset.carouselDirection = e.key === 'ArrowRight' ? '1' : '-1';
  control.click();
});

/* ---------- catalog card buttons ---------- */
document.addEventListener('click', e => {
  const add = e.target.closest('[data-sv-add]');
  if (add) {
    e.preventDefault();
    addToCart([{ id: add.dataset.svAdd, quantity: 1 }]).then(ok => ok && toast(add.dataset.svName + ' added to cart'));
    return;
  }
  const qty = e.target.closest('[data-sv-qty]');
  if (qty) {
    const form = qty.closest('form, .product-purchase');
    const input = form?.querySelector('[data-sv-qty-display]');
    if (input) {
      const next = Math.min(99, Math.max(1, (parseInt(input.value, 10) || 1) + Number(qty.dataset.svQty)));
      input.value = next;
      form.querySelector('[data-sv-qty-input]') && (form.querySelector('[data-sv-qty-input]').value = next);
    }
    return;
  }
});

/* ---------- native PDP ---------- */
const variantDataEl = $('[data-sv-variants]');
const VARIANTS = variantDataEl ? JSON.parse(variantDataEl.textContent) : [];
document.addEventListener('change', e => {
  if (e.target.matches('[data-sv-option]')) {
    const form = e.target.closest('.product-purchase');
    const picked = $$('[data-sv-option]', form).map(s => s.value);
    const v = VARIANTS.find(v => v.options.every((o, i) => o === picked[i]));
    if (v) {
      form.querySelector('[data-sv-variant-id]').value = v.id;
      const price = form.querySelector('[data-sv-price]');
      if (price) price.textContent = money(v.price);
      const btn = form.querySelector('[data-sv-atc-label]');
      if (btn) { btn.disabled = !v.available; btn.textContent = v.available ? `Add to cart — ${money(v.price)}` : 'Sold out'; }
    }
  }
  if (e.target.matches('[name="sv-plan"]')) {
    $$('[data-sv-plan]').forEach(l => l.classList.toggle('selected', l.contains(e.target)));
    const form = e.target.closest('form');
    const planId = form?.querySelector('[data-sv-plan-json]')?.value || '';
    if (form) form.querySelector('[data-sv-selling-plan]').value = e.target.value === 'subscription' ? planId : '';
  }
});
document.addEventListener('submit', e => {
  const form = e.target.closest('form[data-sv-atc]');
  if (!form) return;
  e.preventDefault();
  const id = form.querySelector('[data-sv-variant-id]').value;
  const quantity = Number(form.querySelector('[data-sv-qty-input]').value) || 1;
  const selling_plan = form.querySelector('[data-sv-selling-plan]')?.value;
  const item = { id, quantity };
  if (selling_plan) item.selling_plan = selling_plan;
  addToCart([item]);
});
document.addEventListener('click', e => {
  const zoomBtn = e.target.closest('[data-sv-zoom]');
  if (zoomBtn) {
    const gallery = zoomBtn.closest('.product-gallery');
    const enlarged = gallery?.querySelector('[data-sv-enlarged]');
    const open = enlarged?.hidden === false;
    if (enlarged) enlarged.hidden = open;
    zoomBtn.setAttribute('aria-expanded', String(!open));
    gallery.querySelector('[data-sv-zoom-label]') && (gallery.querySelector('[data-sv-zoom-label]').textContent = open ? 'Click to enlarge' : 'Click to return');
    return;
  }
  const zoomClose = e.target.closest('[data-sv-zoom-close]');
  if (zoomClose) zoomClose.closest('[data-sv-enlarged]') && (zoomClose.closest('[data-sv-enlarged]').hidden = true);
  const thumb = e.target.closest('[data-sv-thumb]');
  if (thumb) {
    const main = thumb.closest('.product-gallery')?.querySelector('[data-sv-main-photo]');
    if (main) main.src = thumb.dataset.svThumb;
  }
});

/* ---------- collection toolbar ---------- */
document.addEventListener('input', e => {
  if (!e.target.matches('[data-sv-collection-search]')) return;
  const q = e.target.value.toLowerCase();
  const grid = $('[data-sv-grid]');
  let shown = 0;
  $$('.catalog-card', grid).forEach(card => {
    const hit = card.textContent.toLowerCase().includes(q);
    card.hidden = !hit;
    if (hit) shown++;
  });
  const count = $('[data-sv-count]');
  if (count) count.textContent = shown + ' products';
  const empty = $('[data-sv-empty]');
  if (empty) empty.hidden = shown > 0;
});
document.addEventListener('change', e => {
  if (e.target.matches('[data-sv-sort]')) location.href = e.target.value;
});
document.addEventListener('click', e => {
  if (e.target.closest('[data-sv-clear]')) {
    const input = $('[data-sv-collection-search]');
    if (input) { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); }
  }
});

/* ---------- privacy prefs ---------- */
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-sv-privacy]');
  if (!f) return;
  e.preventDefault();
  localStorage.setItem('savvy-privacy', JSON.stringify({ analytics: f.querySelector('[name=analytics]').checked }));
  f.querySelector('[data-sv-privacy-done]').hidden = false;
});

/* ---------- smooth hash scroll ---------- */
if (location.hash) {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) setTimeout(() => target.scrollIntoView({ behavior: 'instant', block: 'start' }), 60);
}

/* ---------- boot ---------- */
enhance();
new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && enhance(n))))
  .observe(document.body, { childList: true, subtree: true });
refreshBundleUI();
