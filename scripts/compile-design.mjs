import fs from 'node:fs';
import {createGenerator,escapeSelector} from '@unocss/core';
import presetWind3 from '@unocss/preset-wind3';
import {parse} from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import {createHash} from 'node:crypto';
const uno=await createGenerator({presets:[presetWind3({preflight:false})]});
const manifest=JSON.parse(fs.readFileSync('design-reference/asset-manifest.json'));
const bySha={};for(const [url,d] of Object.entries(manifest)){bySha[d.sha]??=d.file;d.canonical=bySha[d.sha];}
const tokenMap=new Map(),codes=[];let raw='';
const files=fs.readdirSync('design-reference').filter(f=>/^145-\d+\.txt$/.test(f));
for(const file of files){let s=fs.readFileSync('design-reference/'+file,'utf8');if(!s.includes('export default function'))continue;
 s=s.slice(0,s.indexOf('\nSUPER CRITICAL:'));
 s=s.replace(/https:\/\/www\.figma\.com\/api\/mcp\/asset\/[^\"]+/g,url=>'/assets/'+(manifest[url]?.canonical??url.split('/').at(-1)));
 s=s.replace(/Javvy/g,'Savvy').replace(/javvy/g,'savvy').replace(/JAVVY/g,'SAVVY');
 // Preserve design tokens, compile design utilities to static project CSS.
 s=s.replace(/className="([^"]*)"/g,(_,classes)=>{raw+=classes+' ';return 'className="'+classes.split(/\s+/).filter(Boolean).map(t=>{if(!tokenMap.has(t))tokenMap.set(t,'s'+createHash('sha1').update(t).digest('hex').slice(0,9));return tokenMap.get(t)}).join(' ')+'"'});
 const name='Section'+file.match(/145-(\d+)/)[1];s=s.replace(/export default function \w+\(/,'export default function '+name+'(');
 // Image component gives accessible names and central asset substitutions.
 s='import {DesignImage,DesignLink,DesignButton,DesignInput,CarouselControl} from "../ui.jsx";\n'+s.replace(/<img /g,'<DesignImage ');
 const ast=parse(s,{sourceType:'module',plugins:['jsx']});
 const traverse=traverseModule.default??traverseModule; const generate=generateModule.default??generateModule;
 traverse(ast,{JSXElement(path){const n=path.node;const nm=n.openingElement.attributes.find(a=>a.name?.name==='data-name')?.value?.value;let tag=null;
 if(nm==='Link'||nm?.startsWith('Link - '))tag='DesignLink';
 if(nm==='Button'||nm?.startsWith('Button - ')||nm?.endsWith('→ Button'))tag='DesignButton';
 if(nm==='Input')tag='DesignInput';
 const cid=n.openingElement.attributes.find(a=>a.name?.name==='data-node-id')?.value?.value;const controls={'145:601':-1,'145:604':1,'145:1988':-1,'145:1991':1,'145:1205':-1,'145:1208':1,'145:2507':-1,'145:2510':1};if(cid in controls){tag='CarouselControl';n.openingElement.attributes.push({type:'JSXAttribute',name:{type:'JSXIdentifier',name:'direction'},value:{type:'JSXExpressionContainer',expression:{type:'NumericLiteral',value:controls[cid]}}})}
 if(tag){n.openingElement.name.name=tag;if(n.closingElement)n.closingElement.name.name=tag;}
 }});
 s=generate(ast,{compact:false}).code;
 codes.push([name,s]);
}
let {css,matched}=await uno.generate(raw,{preflights:true});
for(const [t,v] of [...tokenMap].sort((a,b)=>b[0].length-a[0].length))css=css.split('.'+escapeSelector(t)).join('.'+v);
// Figma gradients use the original sRGB interpolation.
css=css.replace(/ in oklch/g,'');
css=css.replace(/(-?\d*\.?\d+)px/g,'calc($1px * var(--design-scale, 1))');
fs.writeFileSync('src/design.css',css);
for(const [name,s] of codes)fs.writeFileSync('src/sections/'+name+'.jsx',s);
for(let i=1;i<=12;i++){css+='\n.'+tokenMap.get('col-'+i)+'{grid-column-start:'+i+'}.'+tokenMap.get('row-'+i)+'{grid-row-start:'+i+'}';}fs.writeFileSync('src/design.css',css);
for(const t of ['from-[45%]','to-[92%]','from-1/4'])css+='\n.'+tokenMap.get(t)+'{--un-gradient-'+(t.startsWith('to')?'to':'from')+'-position:'+(t==='from-1/4'?'25%':t.startsWith('to')?'92%':'45%')+'}';fs.writeFileSync('src/design.css',css);
const unsupported=[...tokenMap.keys()].filter(t=>!matched.has(t));fs.writeFileSync('design-reference/unmatched-utilities.json',JSON.stringify(unsupported,null,2));
fs.writeFileSync('src/sections/index.js',"import {lazy} from 'react';\nexport default {\n"+codes.map(([n])=>`${n}:lazy(()=>import('./${n}.jsx')),`).join('\n')+'\n};');
fs.writeFileSync('design-reference/canonical-assets.json',JSON.stringify(manifest,null,2));
console.log('Compiled',codes.length,'sections,',tokenMap.size,'tokens. Unsupported:',unsupported);
