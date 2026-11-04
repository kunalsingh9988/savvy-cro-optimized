import React, {useContext} from 'react';
import {Brand, DesignImage, ShopContext} from './ui';
import {destinationFor} from './routes';

function SiteLink({to,children,...props}) {
  const {navigate}=useContext(ShopContext);const href=to||destinationFor(typeof children==='string'?children:'Home');
  return <a href={href} {...props} onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();navigate(href)}}>{children}</a>;
}

export function WideHero(){
  return <div className="wide-hero">
    <picture className="wide-hero-picture"><source media="(max-width:999px)" srcSet="/assets/savvy-hero-mobile.webp"/><img className="wide-hero-art" src="/assets/savvy-hero-desktop.webp" alt="Savvy protein refreshers, protein creamer, protein coffee and coffee concentrate" fetchPriority="high"/></picture>
    <div className="wide-hero-inner"><div className="wide-hero-copy">
      <p className="hero-eyebrow">☀️ BLACK FRIDAY IN SUMMER 🏖️</p>
      <h1>UP TO 38% OFF<br/>FIRST ORDER</h1>
      <p className="hero-subtitle">Create Café-quality Coffee at Home</p>
      <div className="hero-actions"><SiteLink to="/collections/all#refreshers">Shop Protein Refreshers</SiteLink><SiteLink to="/products/protein-coffee">Shop Protein Coffee</SiteLink></div>
      <div className="hero-promises"><div><img src="/assets/edfb422a-1e98-4c10-80bd-852129ca0132.svg" alt=""/><p><strong>100+ Million</strong> Happy<br/>Coffees Made</p></div><div><img src="/assets/580c64fe-7571-4e99-b4bb-58b1fb285998.svg" alt=""/><p><strong>30-Day</strong> Money-Back<br/>Guarantee</p></div></div>
    </div></div>
  </div>;
}

export function SocialSection(){return <div className="social-section">
  <div className="social-wave" aria-hidden="true"/>
  <div className="social-collage social-collage-left"><DesignImage src="/assets/6fbae302-62a6-4f59-ac65-21f746ba0775.png" alt="Savvy coffee moments and recipes"/></div>
  <div className="social-copy"><span className="social-handle">@savvycoffee</span><h2>Stay<br/>Connected</h2><p>Sip by sip!</p><SiteLink className="social-shop" to="/collections/all">Shop Now</SiteLink></div>
  <div className="social-collage social-collage-right"><DesignImage src="/assets/7b750c11-f051-4db8-8af9-234032cecdea.png" alt="Savvy drinks and flavors"/></div>
</div>}

const groups=[
  ['Shop', [['Build Your Bundle','/products/protein-coffee'],['Coffee Concentrate','/collections/all#concentrates'],['Protein Coffee','/products/protein-coffee'],['Accessories','/collections/all#accessories'],['Subscribe & Save','/products/protein-coffee#purchase-plan']]],
  ['Learn More', [['Giveaway'],['Recipes'],['Blog'],['Become an Affiliate'],['Wholesale']]],
  ['Help', [['Manage Subscriptions'],['Support'],['Reviews','/pages/reviews'],['Find a Store']]],
  ['Legal', [['Returns & Refunds'],['Terms of Sale'],['Privacy Policy'],['Do Not Sell or Share My Personal Information']]],
];
const icons=[['Instagram','5a37177a-c6d3-4c09-a470-c8305ee9b019.svg'],['Facebook','95b26e2b-7053-4a02-b29e-fa0341131f4c.svg'],['TikTok','1ccff89b-29e4-4bcb-a02f-fac2f0683e55.svg'],['Pinterest','59214941-4046-418e-9e74-249f147b97a7.svg'],['Twitter','f039a228-2d7c-46ba-9506-b4ea862afb6c.svg'],['YouTube','69ab37c5-b946-4a1f-88a6-28386ae3317f.svg'],['Snapchat','e7648be1-6b7c-4de8-a514-2a2ed52a5010.svg']];
export function SiteFooter(){
  const {openNewsletter,openInfo}=useContext(ShopContext);
  return <footer className="site-footer" aria-label="Footer"><div className="footer-inner">
    <SiteLink to="/" className="footer-logo" aria-label="Savvy home"><Brand white/></SiteLink>
    <div className="footer-grid">
      {groups.slice(0,2).map(([title,links])=><FooterGroup key={title} title={title} links={links}/>)}
      <div className="footer-newsletter"><div className="newsletter-promises"><span><b>✓</b> No spam ever</span><span><b>✓</b> Best Deals Only</span></div>
        <form className="newsletter-form" onSubmit={e=>{e.preventDefault();openNewsletter(e.currentTarget.elements.email.value)}}><label className="sr-only" htmlFor="footer-email">Email address</label><input id="footer-email" type="email" name="email" autoComplete="email" placeholder="Enter your email" required/><button type="submit">Sign up</button></form>
        <div className="footer-socials" aria-label="Social media">{icons.map(([name,file])=><button key={name} aria-label={name} onClick={()=>openInfo(name)}><img src={'/assets/'+file} alt=""/></button>)}</div>
      </div>
      {groups.slice(2).map(([title,links])=><FooterGroup key={title} title={title} links={links}/>)}
    </div>
    <p className="footer-copyright">© 2026 Savvy Coffee Company. All rights reserved.</p>
  </div></footer>;
}
function FooterGroup({title,links}){return <nav className="footer-group" aria-label={title}><h2>{title}</h2>{links.map(([label,to])=><SiteLink key={label} to={to}>{label}</SiteLink>)}</nav>}
