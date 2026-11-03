// Metres; floor coordinates [x,z], elevation y. No browser dependency.
export const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
export const signedArea=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;
export function intersects(a,b,c,d){
  const on=(p,q,r)=>Math.abs(cross(p,q,r))<1e-9&&r[0]>=Math.min(p[0],q[0])-1e-9&&r[0]<=Math.max(p[0],q[0])+1e-9&&r[1]>=Math.min(p[1],q[1])-1e-9&&r[1]<=Math.max(p[1],q[1])+1e-9;
  return cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
}
export function contains(ring,p){
  let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }return inside;
}
export const ringsIntersect=(a,b)=>a.some((p,i)=>b.some((q,j)=>intersects(p,a[(i+1)%a.length],q,b[(j+1)%b.length])));
export function wallParts(wall,openings){
  const length=Math.hypot(wall.end[0]-wall.start[0],wall.end[1]-wall.start[1]);
  const cuts=[0,length,...openings.flatMap(o=>[o.offset,o.offset+o.width])].sort((a,b)=>a-b);
  const parts=[];
  for(let i=1;i<cuts.length;i++){
    const a=cuts[i-1],b=cuts[i];if(b-a<1e-9)continue;
    const o=openings.find(o=>(a+b)/2>o.offset&&(a+b)/2<o.offset+o.width);
    for(const [bottom,top] of o?[[0,o.sill],[o.sill+o.height,wall.height]]:[[0,wall.height]]){
      if(top-bottom>1e-9)parts.push({from:a,to:b,bottom,top});
    }
  }return parts;
}
export const netArea=s=>Math.abs(signedArea(s.polygon))-(s.holes||[]).reduce((n,h)=>n+Math.abs(signedArea(h)),0);
