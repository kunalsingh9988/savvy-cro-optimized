import catalog from './catalog.json';
import assets from './asset-config.json';
export {catalog};
export const categoryLabels={'protein-coffee':'Protein Coffee',refreshers:'Protein Refreshers',concentrates:'Coffee Concentrate',creamers:'Protein Creamer',syrups:'Coffee Syrup',accessories:'Accessories'};
export const productUrl=p=>'/products/'+p.id;
export const byId=id=>catalog.find(p=>p.id===id);
const imageKey=src=>(assets.assetOverrides[src]||src||'').match(/savvy-\d+-/)?.[0]||assets.assetOverrides[src]||src;
export const productForImage=src=>catalog.find(p=>p.imageKey===imageKey(src));
export function productForName(name){const clean=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');return catalog.find(p=>clean(p.name)===clean(name)||clean(p.name).replace('limitededition','')===clean(name))||catalog.find(p=>clean(p.flavor)===clean(name));}
export const destinations={
 'Home':'/','Products':'/collections/all','Shop All':'/collections/all','Discover':'/collections/all','Shop Now':'/collections/all','Shop Best Sellers':'/collections/all',
 'Build Your Bundle':'/products/protein-coffee','Subscribe & Save':'/products/protein-coffee#purchase-plan',
 'Protein Coffee':'/products/protein-coffee','Shop Protein Coffee':'/products/protein-coffee',
 'Protein Refreshers':'/collections/refreshers','Shop Protein Refreshers':'/collections/refreshers',
 'Coffee Concentrate':'/collections/concentrates','Protein Creamer':'/collections/creamers','Syrups':'/collections/syrups','Coffee Syrup':'/collections/syrups','Accessories':'/collections/accessories','Shop All Accessories':'/collections/accessories',
 'Giveaway':'/pages/giveaway','Recipes':'/pages/recipes','Blog':'/blogs/coffee','Become an Affiliate':'/pages/affiliate','Wholesale':'/pages/wholesale',
 'Manage Subscriptions':'/account/subscriptions','Help':'/pages/support','Support':'/pages/support','Reviews':'/pages/reviews','Find a Store':'/pages/store-locator',
 'Returns & Refunds':'/policies/refund-policy','Terms of Sale':'/policies/terms-of-service','Privacy Policy':'/policies/privacy-policy','Do Not Sell or Share My Personal Information':'/pages/privacy-choices','Account':'/account',
 'Instagram':'/pages/community#instagram','Facebook':'/pages/community#facebook','TikTok':'/pages/community#tiktok','Pinterest':'/pages/community#pinterest','Twitter':'/pages/community#twitter','YouTube':'/pages/community#youtube','Snapchat':'/pages/community#snapchat',
};
export function destinationFor(label){const text=label.replace(/\s+/g,' ').trim();if(destinations[text])return destinations[text];if(/Home Page/.test(text))return '/';if(/AVAILABLE NOW|Cinnamon Roll/.test(text))return '/products/cinnamon-roll-protein-creamer';if(/Review/i.test(text))return '/pages/reviews';if(/recipe/i.test(text))return '/pages/recipes';if(/Mega Deal|Shop All|Discover/i.test(text))return '/collections/all';const product=productForName(text);if(product)return productUrl(product);if(/Creamer/.test(text))return '/collections/creamers';if(/Refresher/.test(text))return '/collections/refreshers';if(/Concentrate/.test(text))return '/collections/concentrates';if(/Syrup/.test(text))return '/collections/syrups';if(/Accessories/.test(text))return '/collections/accessories';if(/Coffee/.test(text))return '/products/protein-coffee';return '/pages/support';}
export const contentRoutes=['/pages/giveaway','/pages/recipes','/blogs/coffee','/pages/affiliate','/pages/wholesale','/account/subscriptions','/pages/support','/pages/reviews','/pages/store-locator','/policies/refund-policy','/policies/terms-of-service','/policies/privacy-policy','/pages/privacy-choices','/pages/community','/account','/checkout','/pages/newsletter','/pages/media'];
