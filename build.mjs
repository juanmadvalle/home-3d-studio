import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {generateModel} from './src/engine/generate.js';
import {diagnoseModel} from './src/engine/diagnostics.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const models=['piso-3-dormitorios','irregular-patio','casa-cubierta-inclinada'].map(id=>JSON.parse(read('./src/models/'+id+'.json')));
for(const m of models){if(m.source?.kind!=='synthetic'||m.source?.license!=='CC0-1.0')throw Error('Public build accepts CC0 synthetic fixtures only');const issues=diagnoseModel(m,generateModel(m));if(issues.length)throw Error(m.id+': '+JSON.stringify(issues));}
const bundle=['geometry','validate','roof','generate','three-adapter','navigation','layout','diagnostics'].map(n=>read('./src/engine/'+n+'.js').replace(/^import .*;\r?\n/gm,'').replace(/\bexport /g,'')).join('\n');
const app='const MODELS='+JSON.stringify(models)+';\n'+bundle+'\n'+read('./src/interface.js')+'\n'+read('./src/viewer.js');
const script='(function(){function start(){try{\n'+app+'\n}catch(error){const output=document.getElementById("status");if(output){output.textContent="No se pudo iniciar el visor: "+error.message;output.setAttribute("role","alert");}console.error(error);}}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();})();';
const html=read('./src/template.html').replace('<!--ENGINE-->',()=>'<script>'+script+'</script>');
mkdirSync(new URL('./dist/',import.meta.url),{recursive:true});
writeFileSync(new URL('./dist/index.html',import.meta.url),html);
console.log('Built dist/index.html ('+models.length+' synthetic models)');
