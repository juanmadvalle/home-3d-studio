// THREE is injected, so the geometry engine also runs in Node without WebGL.
export function createThreeModel(THREE,generated){
  const group=new THREE.Group();
  const palette={wall:0xf1eee5,floor:0xd3b890,patio:0xa6bb91,door:0x986b43,glass:0x8dc9dc,roof:0x888f98,furniture:0x58798a};
  for(const p of generated.primitives){
    let geometry;
    if(p.type==='box')geometry=new THREE.BoxGeometry(...p.size);
    else if(p.type==='mesh'){
      geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p.vertices.flat(),3));geometry.setIndex(p.triangles.flat());geometry.computeVertexNormals();
    }else{
      const shape=new THREE.Shape(p.polygon.map(([x,z])=>new THREE.Vector2(x,-z)));
      for(const hole of p.holes)shape.holes.push(new THREE.Path(hole.map(([x,z])=>new THREE.Vector2(x,-z))));
      geometry=new THREE.ExtrudeGeometry(shape,{depth:p.thickness,bevelEnabled:false});
      geometry.rotateX(-Math.PI/2);geometry.translate(0,p.y-p.thickness,0);
    }
    const material=new THREE.MeshStandardMaterial({color:palette[p.material],roughness:.8,transparent:p.material==='glass',opacity:p.material==='glass'?.35:1,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geometry,material);mesh.name=p.id;mesh.userData.material=p.material;
    if(p.type==='box'){mesh.position.set(...p.center);mesh.rotation.y=p.rotation;}
    group.add(mesh);
  }return group;
}
