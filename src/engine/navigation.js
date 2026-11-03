import {contains} from './geometry.js';
// Circle against oriented solid boxes in X/Z; only solids at the player's height matter.
export function blocked(generated,position,radius=.2,doorsOpen=false){
  return generated.primitives.some(p=>{
    if(p.type!=='box'||!['wall','door','furniture'].includes(p.material)||doorsOpen&&p.material==='door')return false;
    if(position[1]+1.65<p.center[1]-p.size[1]/2||position[1]+.05>p.center[1]+p.size[1]/2)return false;
    const dx=position[0]-p.center[0],dz=position[2]-p.center[2],c=Math.cos(p.rotation),s=Math.sin(p.rotation);
    const x=c*dx-s*dz,z=s*dx+c*dz;
    return Math.hypot(Math.max(Math.abs(x)-p.size[0]/2,0),Math.max(Math.abs(z)-p.size[2]/2,0))<radius;
  });
}
export function onFloor(level,x,z,radius=.2){
  // Sample the footprint to prevent walking off external edges or into uncovered holes.
  return [[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]].every(([dx,dz])=>level.spaces.some(s=>contains(s.polygon,[x+dx,z+dz])&&!s.holes.some(h=>contains(h,[x+dx,z+dz]))));
}
export function movePlayer(generated,level,position,delta,doorsOpen=false,radius=.2){
  const steps=Math.max(1,Math.ceil(Math.hypot(...delta)/(radius/2)));
  if(steps>1000)throw Error('Movement too large');
  const next=[...position];
  for(let i=0;i<steps;i++)for(const [axis,d] of [[0,delta[0]/steps],[2,delta[1]/steps]]){
    const candidate=[...next];candidate[axis]+=d;
    if(onFloor(level,candidate[0],candidate[2],radius)&&!blocked(generated,candidate,radius,doorsOpen))next[axis]=candidate[axis];
  }return next;
}
