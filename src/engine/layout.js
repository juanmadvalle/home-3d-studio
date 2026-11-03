const finite=n=>typeof n==='number'&&Number.isFinite(n);
export const storageKey=model=>'home3d:v2:'+encodeURIComponent(model.id);
export function validateLayout(model,value){
  if(!value||value.schemaVersion!==1||value.modelId!==model.id||!Array.isArray(value.items))throw Error('Layout belongs to another model or is invalid');
  const known=new Map(model.levels.flatMap(l=>(l.furniture||[]).map(f=>[f.id,f]))),ids=new Set();
  if(value.items.length!==known.size)throw Error('Incomplete furniture layout');
  return {schemaVersion:1,modelId:model.id,items:value.items.map(f=>{
    if(!f||!known.has(f.id)||ids.has(f.id)||!Array.isArray(f.position)||f.position.length!==3||!f.position.every(n=>finite(n)&&Math.abs(n)<=10000)||!finite(f.rotation)||Math.abs(f.rotation)>Math.PI*2)throw Error('Invalid furniture layout');
    ids.add(f.id);return {id:f.id,position:[...f.position],rotation:f.rotation};
  })};
}
export function snapshotLayout(model){return {schemaVersion:1,modelId:model.id,items:model.levels.flatMap(l=>(l.furniture||[]).map(f=>({id:f.id,position:[...f.position],rotation:f.rotation})))};}
export function applyLayout(model,value){
  const layout=validateLayout(model,value),copy=structuredClone(model),byId=new Map(layout.items.map(f=>[f.id,f]));
  for(const l of copy.levels)for(const f of l.furniture||[]){const item=byId.get(f.id);f.position=[...item.position];f.rotation=item.rotation;}
  return copy;
}
