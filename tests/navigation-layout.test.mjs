import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {generateModel} from '../src/engine/generate.js';
import {blocked,movePlayer,onFloor} from '../src/engine/navigation.js';
import {applyLayout,snapshotLayout,storageKey} from '../src/engine/layout.js';
import {diagnoseModel} from '../src/engine/diagnostics.js';
const model=()=>JSON.parse(readFileSync(new URL('../src/models/casa-cubierta-inclinada.json',import.meta.url),'utf8'));
test('walking cannot tunnel through perimeter walls',()=>{
  const m=model(),g=generateModel(m),p=movePlayer(g,m.levels[0],[4,0,3],[10,0]);assert.ok(p[0]<7.8);assert.ok(p[0]>7);assert.equal(blocked(g,p),false);
});
test('closed doors block, open doors allow the opening while floor edges remain bounded',()=>{
  const m=model(),g=generateModel(m);assert.equal(blocked(g,[3.5,0,.1],.2,false),true);assert.equal(blocked(g,[3.5,0,.1],.2,true),false);
  assert.equal(onFloor(m.levels[0],3.5,-1),false);
});
test('diagonal solid walls stop movement with oriented-box collision',()=>{
  const g={primitives:[{type:'box',center:[0,1,0],size:[4,2,.15],rotation:Math.PI/4,material:'wall'}]};
  assert.equal(blocked(g,[1,0,-1]),true);assert.equal(blocked(g,[1,0,1]),false);
});
test('furniture blocks walking and a layout cannot leak across models',()=>{
  const m=model(),g=generateModel(m);assert.equal(blocked(g,[2,0,2]),true);
  const layout=snapshotLayout(m),other=structuredClone(m);other.id='different';assert.notEqual(storageKey(m),storageKey(other));assert.throws(()=>applyLayout(other,layout));
});
test('valid layout roundtrips without mutating source',()=>{
  const m=model(),layout=snapshotLayout(m);layout.items[0].position=[4,0,3];layout.items[0].rotation=.5;
  const changed=applyLayout(m,layout);assert.deepEqual(snapshotLayout(changed),layout);assert.deepEqual(m.levels[0].furniture[0].position,[2,0,2]);assert.deepEqual(diagnoseModel(changed,generateModel(changed)),[]);
});
for(const [name,mutate] of [['nonfinite',l=>l.items[0].position[0]=NaN],['unknown id',l=>l.items[0].id='unknown'],['missing item',l=>l.items=[]],['oversized rotation',l=>l.items[0].rotation=999]])test('layout rejects '+name,()=>{const m=model(),l=snapshotLayout(m);mutate(l);assert.throws(()=>applyLayout(m,l));});
test('diagnostics detect furniture outside floor and intersecting walls',()=>{
  const m=model();m.levels[0].furniture[0].position=[0,0,2];const issues=diagnoseModel(m,generateModel(m));assert.ok(issues.some(i=>i.code==='furniture-collision'));assert.ok(issues.some(i=>i.code==='furniture-outside-floor'));
});
