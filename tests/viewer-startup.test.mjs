import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function environment(readyState='complete'){
  const elements=new Map(),listeners={},frames=[];
  function node(id,dataset={}){
    if(!elements.has(id))elements.set(id,{textContent:'',value:'',checked:id==='doors',hidden:false,dataset,children:[],attributes:{},classList:{add(){},remove(){}},setAttribute(k,v){this.attributes[k]=v;},append(c){this.children.push(c);},getBoundingClientRect(){return {width:1024,height:768};},focus(){}});
    return elements.get(id);
  }
  const tabs=['view','furniture','settings'].map(id=>node('tab-'+id,{tab:id})),panels=['view','furniture','settings'].map(id=>node('panel-'+id,{panel:id}));
  const document={readyState,querySelector:s=>node(s.slice(1)),getElementById:node,querySelectorAll:s=>s==='[data-tab]'?tabs:s==='[data-panel]'?panels:[],createElement:()=>node('option-'+Math.random()),documentElement:{dataset:{}},body:{classList:{add(){},remove(){}}},addEventListener:(name,fn)=>listeners[name]=fn};
  const context=vm.createContext({console,document,URLSearchParams,location:{search:'?model=irregular-patio'},structuredClone,localStorage:{getItem(){return null;},setItem(){}},matchMedia:()=>({addListener(){}}),MutationObserver:class{observe(){}},getComputedStyle:()=>({getPropertyValue:()=>'#dbe2e5'}),devicePixelRatio:1,performance,requestAnimationFrame:fn=>frames.push(fn),addEventListener(){},setTimeout,clearTimeout});
  context.window=context;vm.runInContext(read('vendor/three-r128.min.js'),context);
  context.THREE.WebGLRenderer=class{constructor(){this.domElement={};}setPixelRatio(){}setSize(){}render(){}};
  context.THREE.OrbitControls=class{constructor(){this.target=new context.THREE.Vector3();}update(){}};
  const script=read('dist/index.html').match(/<script>([\s\S]*)<\/script>/)[1];
  return {context,script,node,tabs,panels,listeners,frames};
}
test('viewer initializes real scene geometry and panel interactions, including older theme API',()=>{
  const e=environment();vm.runInContext(e.script,e.context);
  assert.match(e.node('status').textContent,/108,00/);assert.equal(e.node('model').children.length,3);assert.equal(e.frames.length,1);
  e.tabs[1].onclick();assert.equal(e.node('sheet').hidden,false);assert.equal(e.panels[1].hidden,false);assert.equal(e.panels[0].hidden,true);
  e.node('close-sheet').onclick();assert.equal(e.node('sheet').hidden,true);
  e.node('plan').onclick();assert.equal(e.node('plan').attributes['aria-pressed'],'true');
  e.node('home').onclick();assert.equal(e.node('orbit').attributes['aria-pressed'],'true');
  // A repeat embed must not fail with a top-level declaration collision.
  assert.doesNotThrow(()=>vm.runInContext(e.script,e.context));
});
test('viewer defers initialization until the document is ready',()=>{
  const e=environment('loading');vm.runInContext(e.script,e.context);assert.equal(e.frames.length,0);
  assert.equal(typeof e.listeners.DOMContentLoaded,'function');e.listeners.DOMContentLoaded();assert.equal(e.frames.length,1);assert.match(e.node('status').textContent,/modelo sintético/);
});
