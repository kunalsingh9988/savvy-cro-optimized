import re,json
sources=['home.xml','145-1427.xml','145-2661.xml','145-4401.xml','145-6186.xml','145-8703.xml']
layout={}
for f in sources:
 s=open('design-reference/'+f).read();nodes={}
 for m in re.finditer(r'<(?:frame|rounded-rectangle|text|vector) id="145:(\d+)" name="([\s\S]*?)" x="([^\"]+)" y="([^\"]+)" width="([^\"]+)" height="([^\"]+)"',s):
  i,n,x,y,w,h=m.groups();nodes[i]={'id':i,'name':n,'x':float(x),'y':float(y),'w':float(w),'h':float(h)}
 layout[f]=nodes
json.dump(layout,open('design-reference/geometry.json','w'),indent=2)
# Vertical document flow with original section spacing.
homeD=['11','45','164','611','648','6','753','890','909','1024','1029','1215']
homeM=['1433','1470','1568','1998','2021','1430','2126','2249','2265','2342','2347','2517']
prodD=['6189','6209','6815','8376','6865','6963','7093','7142','6856','7153','8087','6863','8221','8364']
prodM=['8706','8767','9331','10879','9383','9483','9614','9664','9374','9675','10596','9381','10730','10867']
result={}
for key,f,ids,offset,head,footer in [('homeD',sources[0],homeD,160,'1359','1233'),('homeM',sources[1],homeM,139,'2607','2533'),('productD',sources[4],prodD,120,'8648','8521'),('productM',sources[5],prodM,119,'11125','11023')]:
 nodes=layout[f];a=[dict(nodes[i],y=nodes[i]['y']+offset) for i in ids];a+=[nodes[head],nodes[footer]];result[key]=sorted(a,key=lambda n:n['y'])
for key,f,ids,offset,head,footer in [('collectionD',sources[2],['2698','3097','3217','3595','3748','3838'],483.2121,'4327','4198'),('collectionM',sources[3],['4438','4864','4992','5394','5556','5652'],388.195,'6126','6022')]:
 nodes=layout[f];a=[dict(nodes[i],x=144 if key.endswith('D') else 16,y=nodes[i]['y']+offset) for i in ids];hero=nodes['2664' if key.endswith('D') else '4404'];a+=[dict(hero,y=160 if key.endswith('D') else 139),nodes[head],nodes[footer]];result[key]=sorted(a,key=lambda n:n['y'])
json.dump(result,open('src/layouts.json','w'),indent=2)
