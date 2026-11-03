import {mkdirSync,writeFileSync} from 'node:fs';
const rectangle=(x,z,w,d)=>[[x,z],[x+w,z],[x+w,z+d],[x,z+d]];
const space=(id,name,use,polygon,holes=[])=>({id,name,use,polygon,holes});
const wall=(id,start,end)=>({id,start,end,height:2.7,thickness:.15});
const perimeter=(prefix,p)=>p.map((a,i)=>wall(prefix+i,a,p[(i+1)%p.length]));
const model=(id,name,spaces,walls,openings,polygon,holes=[])=>({schemaVersion:2,id,name,units:'m',axes:'x-right,y-up,z-down',source:{kind:'synthetic',description:'Fixture sintético creado para pruebas. No representa un inmueble real.',license:'CC0-1.0'},levels:[{id:'ground',elevation:0,spaces,walls,openings,roofs:[{id:'roof',kind:'flat',height:2.7,thickness:.15,polygon,holes}]}]});
const outline=rectangle(0,0,12,9);
const conventional=model('piso-3-dormitorios','Piso de tres dormitorios',[
  space('bed1','Dormitorio 1','bedroom',rectangle(0,0,4,3.5)),space('bed2','Dormitorio 2','bedroom',rectangle(4,0,4,3.5)),space('bed3','Dormitorio 3','bedroom',rectangle(8,0,4,3.5)),
  space('hall','Distribuidor','circulation',rectangle(0,3.5,12,1.5)),space('living','Salón','living',rectangle(0,5,6,4)),space('kitchen','Cocina','kitchen',rectangle(6,5,3,4)),space('bath','Baño','bathroom',rectangle(9,5,3,4))
],[...perimeter('outer',outline),wall('bed-divider1',[4,0],[4,3.5]),wall('bed-divider2',[8,0],[8,3.5]),wall('hall-north',[0,3.5],[12,3.5]),wall('hall-south',[0,5],[12,5]),wall('kitchen-divider',[6,5],[6,9]),wall('bath-divider',[9,5],[9,9])],
 [1,5,9].map((offset,i)=>({id:'bed-door'+i,wallId:'hall-north',kind:'door',offset,width:.9,sill:0,height:2.1})).concat([1,7,10].map((offset,i)=>({id:'day-door'+i,wallId:'hall-south',kind:'door',offset,width:.9,sill:0,height:2.1})),[{id:'entry',wallId:'outer3',kind:'door',offset:4,width:.9,sill:0,height:2.1},{id:'window',wallId:'outer2',kind:'window',offset:7,width:2,sill:1,height:1.2}]),outline);
const irregularOutline=[[0,0],[10,0],[12,3],[12,10],[0,10]],patio=rectangle(4,3,3,3);
const irregular=model('irregular-patio','Vivienda irregular con patio',[
  space('interior','Espacio interior','living',irregularOutline,[patio]),space('courtyard','Patio abierto','patio',patio)
],[...perimeter('facade',irregularOutline),...perimeter('patio-wall',patio)],
 [{id:'patio-door',wallId:'patio-wall2',kind:'door',offset:1,width:1,sill:0,height:2.1},{id:'front-door',wallId:'facade0',kind:'door',offset:1,width:1,sill:0,height:2.1},{id:'diagonal-window',wallId:'facade1',kind:'window',offset:.5,width:2,sill:1,height:1.2}],irregularOutline,[patio]);
conventional.levels[0].furniture=[{id:'bed',name:'Cama',position:[2,0,1.5],size:[1.6,.55,2],rotation:0},{id:'sofa',name:'Sofá',position:[2,0,7],size:[2.2,.8,.9],rotation:0}];
irregular.levels[0].furniture=[{id:'table',name:'Mesa',position:[2,0,2],size:[1.4,.75,.8],rotation:0}];
const cabinOutline=rectangle(0,0,8,6);
const cabin=model('casa-cubierta-inclinada','Casa con cubierta inclinada',[space('main','Estancia','living',cabinOutline)],perimeter('cabin-wall',cabinOutline),[{id:'cabin-entry',wallId:'cabin-wall0',kind:'door',offset:3,width:1,sill:0,height:2.1}],cabinOutline);
cabin.levels[0].roofs[0]={...cabin.levels[0].roofs[0],kind:'gable',rise:1.5,ridgeAxis:'x'};
cabin.levels[0].furniture=[{id:'cabin-table',name:'Mesa',position:[2,0,2],size:[1.2,.75,.8],rotation:0}];
mkdirSync(new URL('../src/models/',import.meta.url),{recursive:true});
for(const m of [conventional,irregular,cabin])writeFileSync(new URL('../src/models/'+m.id+'.json',import.meta.url),JSON.stringify(m,null,2)+'\n');
