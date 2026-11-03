// A rectangular gable is explicit in the contract; unsupported contours fail validation.
export function gableMesh(roof,elevation){
  const xs=roof.polygon.map(p=>p[0]),zs=roof.polygon.map(p=>p[1]);
  const x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs),y=elevation+roof.height;
  const alongX=roof.ridgeAxis==='x';
  const a0=alongX?x0:z0,a1=alongX?x1:z1,b0=alongX?z0:x0,b1=alongX?z1:x1;
  const pos=(a,b,h)=>alongX?[a,h,b]:[b,h,a];
  const vertices=[pos(a0,b0,y),pos(a1,b0,y),pos(a0,(b0+b1)/2,y+roof.rise),pos(a1,(b0+b1)/2,y+roof.rise),pos(a0,b1,y),pos(a1,b1,y)];
  vertices.push(...vertices.map(([x,h,z])=>[x,h-roof.thickness,z]));
  const faces=[[0,2,1],[1,2,3],[2,4,3],[3,4,5]];
  faces.push(...faces.map(([a,b,c])=>[a+6,c+6,b+6]));
  const perimeter=[0,1,3,5,4,2];
  for(let i=0;i<perimeter.length;i++){const a=perimeter[i],b=perimeter[(i+1)%perimeter.length];faces.push([a,b,b+6],[a,b+6,a+6]);}
  if(!alongX)faces.forEach(f=>f.reverse());
  return {vertices,triangles:faces};
}
