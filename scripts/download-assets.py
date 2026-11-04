import re,glob,json,subprocess,concurrent.futures,hashlib,os
assets={}
for f in glob.glob('design-reference/*.txt'):
 for name,url in re.findall(r'const (\w+) = "(https://www.figma.com/api/mcp/asset/[^\"]+)";',open(f).read()):
  assets[url]={'name':name,'file':url.rsplit('/',1)[-1]}
def fetch(item):
 url,d=item;p='public/assets/'+d['file']
 if not os.path.exists(p) or os.path.getsize(p)==0:
  
  for attempt in range(4):
   subprocess.run(['curl','-s','-f','-L','--retry','2','-o',p,url],check=True)
   if os.path.getsize(p):break
  if not os.path.getsize(p):raise RuntimeError('Empty asset: '+url)
 data=open(p,'rb').read();d['sha']=hashlib.sha256(data).hexdigest();d['bytes']=len(data)
 return url,d
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
 result=dict(pool.map(fetch,assets.items()))
json.dump(result,open('design-reference/asset-manifest.json','w'),indent=2)
print('Downloaded',len(result),'assets; unique content',len(set(d['sha'] for d in result.values())))
