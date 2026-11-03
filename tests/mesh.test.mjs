import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {generateModel} from '../src/engine/generate.js';import {createThreeModel} from '../src/engine/three-adapter.js';
const context=vm.createContext({console});vm.runInContext(readFileSync(new URL('../vendor/three-r128.min.js',import.meta.url),'utf8'),context);const THREE=context.THREE;
for(const id of ['piso-3-dormitorios','irregular-patio','casa-cubierta-inclinada'])test('real Three.js r128 mesh generation: '+id,()=>{
  const model=JSON.parse(readFileSync(new URL('../src/models/'+id+'.json',import.meta.url),'utf8')),g=generateModel(model),group=createThreeModel(THREE,g);assert.equal(group.children.length,g.primitives.length);
  for(const mesh of group.children){const pos=mesh.geometry.attributes.position;assert.ok(pos.count>0);for(const n of pos.array)assert.ok(Number.isFinite(n));mesh.geometry.computeBoundingBox();assert.ok(Number.isFinite(mesh.geometry.boundingBox.min.y));}
  if(id==='irregular-patio'){
    const roof=group.children.find(m=>m.name==='roof'),ray=new THREE.Raycaster(new THREE.Vector3(5,10,4),new THREE.Vector3(0,-1,0));roof.updateMatrixWorld();assert.equal(ray.intersectObject(roof).length,0);
    ray.set(new THREE.Vector3(2,10,2),new THREE.Vector3(0,-1,0));assert.ok(ray.intersectObject(roof).length>0);
  }
});
