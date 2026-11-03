import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateModel} from '../src/engine/generate.js';
import {validateModel} from '../src/engine/validate.js';
import {wallParts} from '../src/engine/geometry.js';
import {gableMesh} from '../src/engine/roof.js';
import {diagnoseModel,spacesOverlap} from '../src/engine/diagnostics.js';
const load=id=>JSON.parse(readFileSync(new URL('../src/models/'+id+'.json',import.meta.url),'utf8'));
export const flat=()=>load('piso-3-dormitorios');
for(const [id,area] of [['piso-3-dormitorios',108],['irregular-patio',108],['casa-cubierta-inclinada',48]])test(id+' validates, generates and has no diagnosed conflicts',()=>{
  const m=load(id),before=JSON.stringify(m),g=generateModel(m);assert.equal(g.area,area);assert.deepEqual(generateModel(m),g);assert.equal(JSON.stringify(m),before);assert.deepEqual(diagnoseModel(m,g),[]);
});
test('three distinct bedrooms and a genuine patio hole',()=>{
  assert.equal(flat().levels[0].spaces.filter(s=>s.use==='bedroom').length,3);
  const patio=generateModel(load('irregular-patio'));assert.equal(patio.primitives.find(p=>p.material==='roof').holes.length,1);
});
test('wall openings conserve solid volume',()=>{
  const p=wallParts({start:[0,0],end:[10,0],height:3},[{offset:1,width:1,sill:0,height:2},{offset:4,width:2,sill:1,height:1}]);
  assert.equal(p.reduce((n,p)=>n+(p.to-p.from)*(p.top-p.bottom),0),26);
  assert.ok(!p.some(p=>p.from<2&&p.to>1&&p.bottom<2));
});
for(const [label,change] of [
  ['nonfinite',m=>m.levels[0].walls[0].height=NaN],['units',m=>m.units='cm'],
  ['reference',m=>m.levels[0].openings[0].wallId='absent'],['width',m=>m.levels[0].openings[0].width=100],
  ['height',m=>m.levels[0].openings[0].height=20],['duplicate',m=>m.levels[0].walls[0].id='ground'],
  ['unknown field',m=>m.levels[0].walls[0].typo=1],['zero wall',m=>m.levels[0].walls[0].end=m.levels[0].walls[0].start],
  ['crossed polygon',m=>m.levels[0].spaces[0].polygon=[[0,0],[4,4],[0,4],[3,0]]],
  ['external hole',m=>m.levels[0].spaces[0].holes=[[[20,20],[21,20],[21,21],[20,21]]]],
  ['opening overlap',m=>m.levels[0].openings.push({...m.levels[0].openings[0],id:'second'})],
  ['negative furniture size',m=>m.levels[0].furniture[0].size[0]=-1]
])test('reject '+label,()=>{const m=flat();change(m);assert.throws(()=>validateModel(m));});
for(const axis of ['x','z'])test('gable mesh '+axis+' is finite, closed, manifold and has expected volume',()=>{
  const r=load('casa-cubierta-inclinada').levels[0].roofs[0];r.ridgeAxis=axis;
  const {vertices:v,triangles:t}=gableMesh(r,3),edges=new Map();let volume=0;
  assert.equal(Math.max(...v.map(p=>p[1])),7.2);
  for(const [a,b,c] of t){const p=v[a],q=v[b],s=v[c];assert.ok([...p,...q,...s].every(Number.isFinite));
    const u=q.map((n,i)=>n-p[i]),w=s.map((n,i)=>n-p[i]),cross=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];assert.ok(Math.hypot(...cross)>1e-8);
    volume+=(p[0]*(q[1]*s[2]-q[2]*s[1])-p[1]*(q[0]*s[2]-q[2]*s[0])+p[2]*(q[0]*s[1]-q[1]*s[0]))/6;
    for(const [i,j] of [[a,b],[b,c],[c,a]]){const key=[i,j].sort((a,b)=>a-b).join(':');edges.set(key,(edges.get(key)||0)+1);}
  }
  assert.ok([...edges.values()].every(n=>n===2));assert.ok(Math.abs(Math.abs(volume)-48*.15)<1e-8);
});
test('gable rejects nonrectangle and holes',()=>{
  const m=load('casa-cubierta-inclinada');m.levels[0].roofs[0].polygon[1][0]=7;assert.throws(()=>validateModel(m));
  const n=load('irregular-patio');Object.assign(n.levels[0].roofs[0],{kind:'gable',rise:1,ridgeAxis:'x'});assert.throws(()=>validateModel(n));
});
test('diagnostics detect aligned overlapping rooms but allow shared boundaries and patio',()=>{
  const rect=(x,y,w,h)=>({polygon:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],holes:[]});
  assert.equal(spacesOverlap(rect(0,0,4,4),rect(3,0,4,4)),true);
  assert.equal(spacesOverlap(rect(0,0,4,4),rect(4,0,4,4)),false);
  const m=flat();m.levels[0].spaces.push({...m.levels[0].spaces[0],id:'duplicated-space'});assert.ok(diagnoseModel(m,generateModel(m)).some(i=>i.code==='space-overlap'));
});
test('multi-level elevation is reflected in floor, furniture and roof',()=>{
  const m=flat(),l=structuredClone(m.levels[0]);l.elevation=3;l.id='up';
  for(const key of ['spaces','walls','openings','roofs','furniture'])for(const o of l[key]){o.id='up-'+o.id;if(o.wallId)o.wallId='up-'+o.wallId;}
  m.levels.push(l);const g=generateModel(m);assert.equal(g.area,216);assert.equal(g.primitives.find(p=>p.id==='up-roof').y,5.7);assert.equal(g.primitives.find(p=>p.id==='up-bed').center[1],3.275);
});
test('compiled viewer parses and has no unresolved imports',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),code=html.match(/<script>([\s\S]*)<\/script>/)[1];assert.doesNotThrow(()=>new Function(code));assert.ok(!/^import /m.test(code));
});
