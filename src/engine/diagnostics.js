import {contains,cross} from './geometry.js';
const onEdge=(ring,p)=>ring.some((a,i)=>{const b=ring[(i+1)%ring.length];return Math.abs(cross(a,b,p))<1e-8&&p[0]>=Math.min(a[0],b[0])-1e-8&&p[0]<=Math.max(a[0],b[0])+1e-8&&p[1]>=Math.min(a[1],b[1])-1e-8&&p[1]<=Math.max(a[1],b[1])+1e-8;});
const inside=(s,p)=>contains(s.polygon,p)&&!onEdge(s.polygon,p)&&!s.holes.some(h=>contains(h,p)||onEdge(h,p));
const belongs=(s,p)=>(contains(s.polygon,p)||onEdge(s.polygon,p))&&!s.holes.some(h=>contains(h,p)||onEdge(h,p));
const samples=ring=>[...ring,...ring.map((p,i)=>{const q=ring[(i+1)%ring.length];return [(p[0]+q[0])/2,(p[1]+q[1])/2];}),[ring.reduce((n,p)=>n+p[0],0)/ring.length,ring.reduce((n,p)=>n+p[1],0)/ring.length]];
export function spacesOverlap(a,b){
  if(samples(a.polygon).some(p=>belongs(a,p)&&inside(b,p))||samples(b.polygon).some(p=>inside(a,p)&&belongs(b,p)))return true;
  return a.polygon.some((p,i)=>b.polygon.some((q,j)=>{
    const pp=a.polygon[(i+1)%a.polygon.length],qq=b.polygon[(j+1)%b.polygon.length];
    return cross(p,pp,q)*cross(p,pp,qq)<-1e-12&&cross(q,qq,p)*cross(q,qq,pp)<-1e-12;
  }));
}
export function boxFootprint(p){
  const c=Math.cos(p.rotation),s=Math.sin(p.rotation);
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>{const x=a*p.size[0]/2,z=b*p.size[2]/2;return [p.center[0]+c*x+s*z,p.center[2]-s*x+c*z];});
}
export function diagnoseModel(model,generated){
  const issues=[];
  for(const l of model.levels){
    for(let i=0;i<l.spaces.length;i++)for(let j=i+1;j<l.spaces.length;j++)if(spacesOverlap(l.spaces[i],l.spaces[j]))issues.push({code:'space-overlap',ids:[l.spaces[i].id,l.spaces[j].id]});
    for(const f of l.furniture||[]){
      const box=generated.primitives.find(p=>p.id===f.id),shape={polygon:boxFootprint(box),holes:[]};
      if(!samples(shape.polygon).every(p=>l.spaces.some(s=>inside(s,p))))issues.push({code:'furniture-outside-floor',ids:[f.id]});
      for(const p of generated.primitives){
        if(p===box||p.type!=='box'||!['wall','furniture'].includes(p.material))continue;
        if(box.center[1]+box.size[1]/2<=p.center[1]-p.size[1]/2||box.center[1]-box.size[1]/2>=p.center[1]+p.size[1]/2)continue;
        if(spacesOverlap(shape,{polygon:boxFootprint(p),holes:[]}))issues.push({code:'furniture-collision',ids:[f.id,p.id]});
      }
    }
  }return issues;
}
