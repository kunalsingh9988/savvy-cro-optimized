import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.CHECK_URL||'http://localhost:5173';
const browser=await chromium.launch({headless:true});
for(const width of [320,390,768,1024,1440,1920,2560,3440]){
 const page=await browser.newPage({viewport:{width,height:1080}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of ['/','/collections/all','/products/protein-coffee']){
  const response=await page.goto(base+route);assert.equal(response.status(),200);
  await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode().catch(()=>{})})));
  const data=await page.evaluate(()=>{
   const footer=document.querySelector('footer'),form=footer.querySelector('form');
   const f=footer.getBoundingClientRect(),grid=footer.querySelector('.footer-grid').getBoundingClientRect();
   const nodes=[...footer.querySelectorAll('.footer-grid>nav,.footer-newsletter')].map(n=>n.getBoundingClientRect());
   const overlap=nodes.some((a,i)=>nodes.some((b,j)=>j>i&&a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1));
   return {viewport:innerWidth,scroll:document.documentElement.scrollWidth,footer:{x:f.x,width:f.width},overlap,formWidth:form.clientWidth,missing:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),hero:document.querySelector('.wide-hero')?.getBoundingClientRect().width};
  });
  assert.equal(data.scroll,width,`${route} horizontal overflow at ${width}`);
  assert.equal(data.footer.x,0);assert.equal(data.footer.width,width);
  assert.equal(data.overlap,false,`Footer overlap at ${width}`);assert(data.formWidth>200);
  assert.deepEqual(data.missing,[]);assert.deepEqual(errors,[]);
  if(route==='/')assert.equal(data.hero,width);
  console.log('PASS',width,route);
 }
 await page.close();
}
await browser.close();
