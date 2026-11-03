const $=selector=>document.querySelector(selector),status=$('#status');
try{
  if(!window.THREE||!THREE.OrbitControls)throw Error('No se pudo cargar el motor 3D. Comprueba la conexión.');
  const id=new URLSearchParams(location.search).get('model');
  const original=MODELS.find(m=>m.id===id)||MODELS[0];let model=structuredClone(original),notice='';
  try{const saved=localStorage.getItem(storageKey(model));if(saved)model=applyLayout(model,JSON.parse(saved));}catch{notice='No se pudo recuperar la distribución guardada.';}
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xe6eaed);
  const ui=setupInterface(()=>scene.background.set(getComputedStyle(document.documentElement).getPropertyValue('--scene').trim()||'#dbe2e5'));
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));$('#stage').append(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(45,1,.05,1000),controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
  scene.add(new THREE.HemisphereLight(0xffffff,0x656565,1));const sun=new THREE.DirectionalLight(0xffffff,.8);sun.position.set(-10,20,10);scene.add(sun);
  let generated,group,showRoof=false,doorsOpen=true,walking=false,player,yaw=0,previous=performance.now();const keysDown=new Set();
  function rebuild(){
    generated=generateModel(model);const issues=diagnoseModel(model,generated);if(issues.length)throw Error('Distribución no válida: '+issues[0].code);
    if(group){scene.remove(group);group.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});}
    group=createThreeModel(THREE,generated);scene.add(group);visibility();
    status.textContent=generated.area.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' m² interiores · modelo sintético';
  }
  function visibility(){if(group)for(const m of group.children){if(m.userData.material==='roof')m.visible=showRoof;if(m.userData.material==='door')m.visible=!doorsOpen;if(m.userData.material==='wall'){const transparent=$('#walls').checked;m.material.transparent=transparent;m.material.opacity=transparent?.28:1;m.material.depthWrite=!transparent;m.material.needsUpdate=true;}}}
  // Saved layouts are untrusted. Recover the published model if a saved arrangement is invalid.
  try{rebuild();}catch{model=structuredClone(original);rebuild();notice='Se ha recuperado la distribución original.';}
  const [x,z]=generated.bounds.min,[xx,zz]=generated.bounds.max,cx=(x+xx)/2,cz=(z+zz)/2,span=Math.max(xx-x,zz-z,1);
  function orbit(){walking=false;keysDown.clear();controls.enabled=true;ui.setView('orbit');camera.position.set(cx-span,span*1.5,cz+span*1.5);controls.target.set(cx,0,cz);controls.update();$('#help').textContent='Arrastra para girar · Pellizca o usa la rueda para acercar';}
  orbit();
  $('#roof').onclick=()=>{showRoof=!showRoof;visibility();$('#roof').setAttribute('aria-pressed',String(showRoof));$('#roof').setAttribute('aria-label',showRoof?'Ocultar cubierta':'Mostrar cubierta');};
  $('#walls').onchange=visibility;
  $('#doors').onchange=()=>{doorsOpen=$('#doors').checked;visibility();};
  $('#plan').onclick=()=>{orbit();ui.setView('plan');camera.position.set(cx,span*1.7,cz+.001);controls.target.set(cx,0,cz);controls.update();};
  $('#orbit').onclick=orbit;
  $('#home').onclick=orbit;
  const select=$('#model');for(const m of MODELS){const o=document.createElement('option');o.value=m.id;o.textContent=m.name;select.append(o);}select.value=model.id;
  select.onchange=()=>{location.search='?model='+encodeURIComponent(select.value);};
  const furniture=$('#furniture');for(const f of model.levels.flatMap(l=>l.furniture||[])){const o=document.createElement('option');o.value=f.id;o.textContent=f.name;furniture.append(o);}
  function currentFurniture(){return model.levels.flatMap(l=>l.furniture||[]).find(f=>f.id===furniture.value);}
  function fields(){const f=currentFurniture();if(!f)return;$('#fx').value=f.position[0];$('#fz').value=f.position[2];$('#angle').value=Math.round(f.rotation*180/Math.PI);}
  furniture.onchange=fields;fields();
  function persist(){try{localStorage.setItem(storageKey(model),JSON.stringify(snapshotLayout(model)));$('#message').textContent='Distribución guardada para este modelo.';}catch{$('#message').textContent='No se pudo guardar en este navegador. Puedes exportar el archivo.';}}
  $('#edit').onsubmit=e=>{e.preventDefault();const before=structuredClone(model),f=currentFurniture();if(!f)return;
    try{f.position[0]=Number($('#fx').value);f.position[2]=Number($('#fz').value);f.rotation=Number($('#angle').value)*Math.PI/180;rebuild();persist();}
    catch(error){model=before;rebuild();fields();$('#message').textContent=error.message;}
  };
  function download(name,data){const url=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('#export').onclick=()=>download(model.id+'-layout.json',JSON.stringify(snapshotLayout(model),null,2));
  $('#import').onchange=async e=>{const file=e.target.files[0];if(!file)return;const before=model;
    try{if(file.size>1000000)throw Error('El archivo supera 1 MB.');model=applyLayout(model,JSON.parse(await file.text()));rebuild();fields();persist();}
    catch(error){model=before;rebuild();$('#message').textContent=error.message;}finally{e.target.value='';}
  };
  $('#reset').onclick=()=>{model=structuredClone(original);rebuild();fields();persist();orbit();};
  $('#walk').onclick=()=>{
    if(walking){orbit();return;}const level=model.levels[0];let start;
    // Find a collision-free point without relying on a property-specific spawn coordinate.
    for(let zz=z+.4;zz<zzMax()&&!start;zz+=.3)for(let xx=x+.4;xx<generated.bounds.max[0]&&!start;xx+=.3){const p=[xx,level.elevation,zz];if(onFloor(level,xx,zz)&&!blocked(generated,p,.2,doorsOpen))start=p;}
    if(!start){$('#message').textContent='No hay un punto libre para iniciar el recorrido.';return;}
    player=start;walking=true;keysDown.clear();controls.enabled=false;showRoof=false;visibility();$('#roof').setAttribute('aria-pressed','false');$('#roof').setAttribute('aria-label','Mostrar cubierta');ui.setView('walk');ui.closePanel();
    $('#help').textContent='Usa las flechas en pantalla o W/A/S/D · Esc para salir · Primera planta';
  };
  function zzMax(){return generated.bounds.max[1];}
  addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;if(e.key==='Escape')orbit();if(walking&&['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();keysDown.add(e.key);}});
  addEventListener('keyup',e=>keysDown.delete(e.key));addEventListener('blur',()=>keysDown.clear());
  for(const button of document.querySelectorAll('[data-key]')){
    button.onpointerdown=e=>{if(!walking)return;e.preventDefault();button.setPointerCapture(e.pointerId);keysDown.add(button.dataset.key);};
    const release=()=>keysDown.delete(button.dataset.key);button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;
  }
  function resize(){const rect=$('#stage').getBoundingClientRect();camera.aspect=rect.width/Math.max(rect.height,1);camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height);}addEventListener('resize',resize);resize();
  function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-previous)/1000,.05);previous=now;
    if(walking){yaw+=(Number(keysDown.has('ArrowLeft'))-Number(keysDown.has('ArrowRight')))*dt*1.7;const f=Number(keysDown.has('w')||keysDown.has('ArrowUp'))-Number(keysDown.has('s')||keysDown.has('ArrowDown')),s=Number(keysDown.has('d'))-Number(keysDown.has('a')),norm=Math.max(1,Math.hypot(f,s));
      player=movePlayer(generated,model.levels[0],player,[(s*Math.cos(yaw)-f*Math.sin(yaw))*dt*2/norm,(-f*Math.cos(yaw)-s*Math.sin(yaw))*dt*2/norm],doorsOpen);
      camera.position.set(player[0],player[1]+1.65,player[2]);camera.lookAt(player[0]-Math.sin(yaw),player[1]+1.65,player[2]-Math.cos(yaw));
    }else controls.update();renderer.render(scene,camera);
  }requestAnimationFrame(frame);$('#message').textContent=notice;
}catch(error){status.textContent=error.message;status.setAttribute('role','alert');}
