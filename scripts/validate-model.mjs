import {readFileSync} from 'node:fs';
import {generateModel} from '../src/engine/generate.js';
const path=process.argv[2];
if(!path){console.error('Usage: node scripts/validate-model.mjs path/to/model.json');process.exitCode=1;}
else{const g=generateModel(JSON.parse(readFileSync(path,'utf8')));console.log(JSON.stringify({id:g.id,area:g.area,bounds:g.bounds,primitives:g.primitives.length},null,2));}
