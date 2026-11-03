import {writeFileSync} from 'node:fs';
const num={type:'number'},positive={type:'number',exclusiveMinimum:0};
const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const array=items=>({type:'array',items,maxItems:5000});
const ref=name=>({$ref:'#/$defs/'+name});
const point={type:'array',items:{type:'number',minimum:-10000,maximum:10000},minItems:2,maxItems:2};
const polygon={type:'array',items:point,minItems:3,maxItems:1000};
const surface={polygon:ref('polygon'),holes:{...array(ref('polygon')),maxItems:100}};
const roofBase={id:{type:'string',minLength:1},height:{type:'number',minimum:.1,maximum:30},thickness:{type:'number',minimum:.01,maximum:2},...surface};
const schema={
  $schema:'https://json-schema.org/draft/2020-12/schema',title:'Home 3D normalized model v2',
  ...object({schemaVersion:{const:2},id:{type:'string',pattern:'^[a-z0-9-]{1,64}$'},name:{type:'string',minLength:1},units:{const:'m'},axes:{const:'x-right,y-up,z-down'},source:object({kind:{enum:['synthetic','private-plan']},description:{type:'string'},license:{type:'string'}},['kind','description']),levels:{type:'array',items:ref('level'),minItems:1,maxItems:50}}),
  $defs:{point,polygon,
    space:object({id:{type:'string',minLength:1},name:{type:'string'},use:{enum:['bedroom','living','kitchen','bathroom','circulation','patio','other']},...surface}),
    wall:object({id:{type:'string',minLength:1},start:ref('point'),end:ref('point'),height:{type:'number',minimum:.1,maximum:30},thickness:{type:'number',minimum:.01,maximum:2}}),
    opening:object({id:{type:'string',minLength:1},wallId:{type:'string'},kind:{enum:['door','window']},offset:{type:'number',minimum:0,maximum:20000},width:{...positive,minimum:.01,maximum:100},sill:{type:'number',minimum:0,maximum:30},height:{type:'number',minimum:.01,maximum:30}}),
    roof:{oneOf:[object({...roofBase,kind:{const:'flat'}}),object({...roofBase,kind:{const:'gable'},polygon:{...polygon,minItems:4,maxItems:4},holes:{type:'array',maxItems:0},rise:{type:'number',minimum:.01,maximum:20},ridgeAxis:{enum:['x','z']}})]},
    furniture:object({id:{type:'string',minLength:1},name:{type:'string'},position:{type:'array',items:{type:'number',minimum:-10000,maximum:10000},minItems:3,maxItems:3},size:{type:'array',items:{type:'number',minimum:.01,maximum:100},minItems:3,maxItems:3},rotation:{type:'number',minimum:-Math.PI*2,maximum:Math.PI*2}}),
    level:object({id:{type:'string',minLength:1},elevation:{type:'number',minimum:-100,maximum:1000},spaces:array(ref('space')),walls:array(ref('wall')),openings:array(ref('opening')),roofs:array(ref('roof')),furniture:{...array(ref('furniture')),maxItems:1000}},['id','elevation','spaces','walls','openings','roofs'])
  }
};
writeFileSync(new URL('../schemas/model-v2.schema.json',import.meta.url),JSON.stringify(schema,null,2)+'\n');
