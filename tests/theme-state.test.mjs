import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../web/observatory/shared/theme.js',import.meta.url),'utf8');
function make({stored=null,dark=false,blocked=false,pathname='/lab/lunisolar'}={}){
 const listeners=new Map(),mediaListeners=new Map(),events=[],dataset={};
 const media={matches:dark,addEventListener:(type,fn)=>mediaListeners.set(type,fn)};
 const storage={getItem:()=>{if(blocked)throw Error('denied');return stored;},setItem:(key,value)=>{if(blocked)throw Error('denied');assert.equal(key,'astronomy-lab-theme');stored=value;}};
 const context=vm.createContext({URL,document:{documentElement:{dataset}},location:{href:'http://local.invalid'+pathname},localStorage:storage,matchMedia:()=>media,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},addEventListener:(type,fn)=>listeners.set(type,fn),dispatchEvent:event=>events.push(event)});
 vm.runInContext(source,context);
 return {context,api:context.AstronomyLabTheme,dataset,events,stored:()=>stored,emit:(type,event={})=>listeners.get(type)?.(event),system(value){media.matches=value;mediaListeners.get('change')?.();}};
}
test('theme restores synchronously and explicit choice outranks system changes',()=>{
 const w=make({stored:'dark'});assert.equal(w.dataset.alTheme,'dark');assert.equal(w.dataset.alThemeScope,'tools');
 w.api.set('light');assert.equal(w.stored(),'light');w.system(true);assert.equal(w.api.get(),'light');assert.equal(w.events.length,1);
 assert.throws(()=>w.api.set('sepia'));assert.equal(w.api.get(),'light');
});
test('system changes remain active until a choice, and storage updates synchronize it',()=>{
 const w=make();w.system(true);assert.equal(w.api.get(),'dark');w.api.set('light');
 w.emit('storage',{key:'unrelated',newValue:'dark'});assert.equal(w.api.get(),'light');
 w.emit('storage',{key:'astronomy-lab-theme',newValue:'dark'});assert.equal(w.api.get(),'dark');
 w.emit('storage',{key:null,newValue:null});w.system(false);assert.equal(w.api.get(),'light');
});
test('storage refusal preserves the current page choice through pageshow',()=>{
 const w=make({blocked:true});w.api.set('dark');w.emit('pageshow');assert.equal(w.api.get(),'dark');assert.equal(w.dataset.alTheme,'dark');
});
test('home keeps a fixed design scope without changing the remembered preference or URL',()=>{
 const w=make({stored:'dark',pathname:'/'});assert.equal(w.dataset.alThemeScope,'home');
 w.api.syncRoute('http://local.invalid/labs/earth-moon/?mode=phase');assert.equal(w.dataset.alThemeScope,'tools');assert.equal(w.api.get(),'dark');assert.equal(w.context.location.href,'http://local.invalid/');
 w.api.syncRoute('http://local.invalid/#tools');assert.equal(w.dataset.alThemeScope,'home');assert.equal(w.stored(),'dark');
});
