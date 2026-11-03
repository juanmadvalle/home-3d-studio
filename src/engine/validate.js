import {signedArea,intersects,contains,ringsIntersect} from './geometry.js';
const fail=m=>{throw new Error(m);};
const number=(n,min,max,label)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)fail(label);};
const point=p=>{if(!Array.isArray(p)||p.length!==2)fail('point');p.forEach(n=>number(n,-10000,10000,'coordinate'));};
const keys=(o,names)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).some(k=>!names.includes(k)))fail('unknown fields');};
function ring(p){
  if(!Array.isArray(p)||p.length<3||p.length>1000)fail('polygon');p.forEach(point);
  if(Math.abs(signedArea(p))<1e-6)fail('polygon area');
  for(let i=0;i<p.length;i++){
    if(Math.hypot(p[i][0]-p[(i+1)%p.length][0],p[i][1]-p[(i+1)%p.length][1])<1e-6)fail('zero edge');
    for(let j=i+1;j<p.length;j++)if(j!==i+1&&!(i===0&&j===p.length-1)&&intersects(p[i],p[(i+1)%p.length],p[j],p[(j+1)%p.length]))fail('self-intersection');
  }
}
function surface(s){
  ring(s.polygon);if(!Array.isArray(s.holes)||s.holes.length>100)fail('holes');
  s.holes.forEach((h,i)=>{ring(h);if(!h.every(p=>contains(s.polygon,p))||ringsIntersect(h,s.polygon))fail('hole outside surface');
    s.holes.slice(0,i).forEach(k=>{if(ringsIntersect(h,k)||contains(h,k[0])||contains(k,h[0]))fail('overlapping holes');});});
}
export function validateModel(m){
  keys(m,['schemaVersion','id','name','units','axes','source','levels']);
  if(!m||m.schemaVersion!==2||m.units!=='m'||m.axes!=='x-right,y-up,z-down')fail('contract version/units/axes');
  if(typeof m.id!=='string'||!/^[a-z0-9-]{1,64}$/.test(m.id)||typeof m.name!=='string'||!m.name.trim())fail('identity');
  if(!m.source||!['synthetic','private-plan'].includes(m.source.kind)||typeof m.source.description!=='string')fail('provenance');
  keys(m.source,['kind','description','license']);if(m.source.license!==undefined&&typeof m.source.license!=='string')fail('license');
  if(!Array.isArray(m.levels)||!m.levels.length||m.levels.length>50)fail('levels');
  const ids=new Set();const id=o=>{if(!o||typeof o.id!=='string'||!o.id||ids.has(o.id))fail('duplicate/missing id');ids.add(o.id);};
  m.levels.forEach(l=>{
    keys(l,['id','elevation','spaces','walls','openings','roofs','furniture']);
    id(l);number(l.elevation,-100,1000,'elevation');
    for(const k of ['spaces','walls','openings','roofs'])if(!Array.isArray(l[k])||l[k].length>5000)fail(k);
    l.spaces.forEach(s=>{keys(s,['id','name','use','polygon','holes']);id(s);surface(s);if(typeof s.name!=='string'||!['bedroom','living','kitchen','bathroom','circulation','patio','other'].includes(s.use))fail('space use/name');});
    const walls=new Map();l.walls.forEach(w=>{keys(w,['id','start','end','height','thickness']);id(w);point(w.start);point(w.end);if(Math.hypot(w.end[0]-w.start[0],w.end[1]-w.start[1])<1e-6)fail('zero wall');number(w.height,.1,30,'wall height');number(w.thickness,.01,2,'wall thickness');walls.set(w.id,w);});
    l.openings.forEach((o,i)=>{
      keys(o,['id','wallId','kind','offset','width','sill','height']);
      id(o);const w=walls.get(o.wallId);if(!w)fail('unknown wall');if(!['door','window'].includes(o.kind))fail('opening kind');
      number(o.offset,0,20000,'offset');number(o.width,.01,100,'width');number(o.sill,0,30,'sill');number(o.height,.01,30,'opening height');
      if(o.offset+o.width>Math.hypot(w.end[0]-w.start[0],w.end[1]-w.start[1])+1e-9||o.sill+o.height>w.height+1e-9)fail('opening outside wall');
      l.openings.slice(0,i).forEach(p=>{if(p.wallId===o.wallId&&p.offset<o.offset+o.width-1e-9&&o.offset<p.offset+p.width-1e-9)fail('overlapping openings');});
    });
    l.roofs.forEach(r=>{
      keys(r,r.kind==='gable'?['id','kind','height','thickness','polygon','holes','ridgeAxis','rise']:['id','kind','height','thickness','polygon','holes']);id(r);surface(r);
      if(!['flat','gable'].includes(r.kind))fail('unsupported roof');number(r.height,.1,30,'roof height');number(r.thickness,.01,2,'roof thickness');
      if(r.kind==='gable'){
        if(!['x','z'].includes(r.ridgeAxis))fail('ridge axis');number(r.rise,.01,20,'roof rise');
        if(r.holes.length||r.polygon.length!==4)fail('gable requires rectangle without holes');
        const xs=[...new Set(r.polygon.map(p=>p[0]))],zs=[...new Set(r.polygon.map(p=>p[1]))];
        if(xs.length!==2||zs.length!==2)fail('gable requires axis-aligned rectangle');
      }
    });
    if(l.furniture!==undefined){
      if(!Array.isArray(l.furniture)||l.furniture.length>1000)fail('furniture');
      l.furniture.forEach(f=>{keys(f,['id','name','position','size','rotation']);id(f);if(typeof f.name!=='string')fail('furniture name');
        if(!Array.isArray(f.position)||f.position.length!==3||!Array.isArray(f.size)||f.size.length!==3)fail('furniture dimensions');
        f.position.forEach(n=>number(n,-10000,10000,'furniture position'));f.size.forEach(n=>number(n,.01,100,'furniture size'));number(f.rotation,-Math.PI*2,Math.PI*2,'rotation');
      });
    }
  });return m;
}
