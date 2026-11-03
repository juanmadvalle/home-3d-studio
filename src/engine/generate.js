import {validateModel} from './validate.js';
import {wallParts,netArea} from './geometry.js';
import {gableMesh} from './roof.js';
// Output is renderer-independent and deterministic; all placement is data-derived.
export function generateModel(input){
  const m=validateModel(input),primitives=[];
  for(const l of m.levels){
    for(const s of l.spaces)primitives.push({type:'surface',id:s.id,polygon:s.polygon,holes:s.holes,y:l.elevation,thickness:.12,material:s.use==='patio'?'patio':'floor'});
    for(const w of l.walls){
      const length=Math.hypot(w.end[0]-w.start[0],w.end[1]-w.start[1]),dx=(w.end[0]-w.start[0])/length,dz=(w.end[1]-w.start[1])/length;
      for(const p of wallParts(w,l.openings.filter(o=>o.wallId===w.id)))primitives.push({type:'box',id:w.id,center:[w.start[0]+dx*(p.from+p.to)/2,l.elevation+(p.bottom+p.top)/2,w.start[1]+dz*(p.from+p.to)/2],size:[p.to-p.from,p.top-p.bottom,w.thickness],rotation:-Math.atan2(dz,dx),material:'wall'});
      for(const o of l.openings.filter(o=>o.wallId===w.id))primitives.push({type:'box',id:o.id,center:[w.start[0]+dx*(o.offset+o.width/2),l.elevation+o.sill+o.height/2,w.start[1]+dz*(o.offset+o.width/2)],size:[o.width,o.height,.025],rotation:-Math.atan2(dz,dx),material:o.kind==='window'?'glass':'door'});
    }
    for(const r of l.roofs)primitives.push(r.kind==='gable'?{type:'mesh',id:r.id,...gableMesh(r,l.elevation),material:'roof'}:{type:'surface',id:r.id,polygon:r.polygon,holes:r.holes,y:l.elevation+r.height,thickness:r.thickness,material:'roof'});
    for(const f of l.furniture||[])primitives.push({type:'box',id:f.id,center:[f.position[0],l.elevation+f.position[1]+f.size[1]/2,f.position[2]],size:[...f.size],rotation:f.rotation,material:'furniture'});
  }
  const points=m.levels.flatMap(l=>[...l.spaces.flatMap(s=>s.polygon),...l.walls.flatMap(w=>[w.start,w.end])]);
  if(!points.length)throw Error('Empty geometry');
  const bounds={min:[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1]))],max:[Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]};
  return {id:m.id,primitives,bounds,area:m.levels.reduce((n,l)=>n+l.spaces.reduce((a,s)=>a+(s.use==='patio'?0:netArea(s)),0),0)};
}
