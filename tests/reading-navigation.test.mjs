import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ContentLoadError,loadJSON,loadArticleHTML,validCatalog,validStatus,validIntegration,validArticleHTML,createRouteRequests} from '../web/observatory/shared/load-content.js';
import {createHistoryState,ensureHistoryEntry,createReadingStore,indexReadingBlocks,captureReadingPosition,restorationTarget,restoreReadingPosition,decodeAnchor} from '../web/observatory/shared/reading-state.js';

const response = (body,status=200) => new Response(typeof body==='string'?body:JSON.stringify(body),{status});
const lesson = '<!doctype html><html><body><section class="level1"><h1>月亮的几种时间</h1><p>文章正文</p></section></body></html>';
const catalog = JSON.parse(await fs.readFile(new URL('../web/observatory/data/catalog.json',import.meta.url),'utf8'));

test('catalog HTTP failure, invalid JSON, invalid topology and successful retry stay distinguishable',async()=>{
 await assert.rejects(loadJSON('/data/catalog.json',{fetchImpl:async()=>response('Service unavailable',500),validate:validCatalog}),error=>error instanceof ContentLoadError&&error.status===500);
 await assert.rejects(loadJSON('/data/catalog.json',{fetchImpl:async()=>response('{broken'),validate:validCatalog}),/无法读取/);
 await assert.rejects(loadJSON('/data/catalog.json',{fetchImpl:async()=>response({articles:[],assets:[]}),validate:validCatalog}),/缺少必要内容/);
 const duplicate={...catalog,articles:[...catalog.articles.slice(0,15),catalog.articles[0]]};assert.equal(validCatalog(duplicate),false);
 assert.equal(validCatalog({...catalog,assets:[{...catalog.assets[0],used_by:3}]}),false,'malformed asset filters must fail at load, not after a user selects a lesson');
 assert.equal(await loadJSON('/data/catalog.json',{fetchImpl:async()=>response(catalog),validate:validCatalog}).then(data=>data.articles.length),16);
});

test('article 404/500 and HTTP 200 shell are rejected before inserting a document',async()=>{
 for(const status of [404,500])await assert.rejects(loadArticleHTML('/reading/L03.html',{fetchImpl:async()=>response('Not found',status)}),error=>error.status===status);
 await assert.rejects(loadArticleHTML('/reading/L03.html',{fetchImpl:async()=>response('<html><body><h1>Server error</h1><p>Please try later</p></body></html>')}),/不是完整文章/);
 assert.equal(await loadArticleHTML('/reading/L03.html',{fetchImpl:async()=>response(lesson)}),lesson);
 for(let number=1;number<=16;number++)assert.equal(validArticleHTML(await fs.readFile(new URL(`../build/articles/L${String(number).padStart(2,'0')}.html`,import.meta.url),'utf8')),true,`published L${number} remains accepted`);
});

test('source summaries require usable status/count/scope rather than silently showing undefined',async()=>{
 assert.equal(validStatus({state:'pending',count:0}),true);
 assert.equal(validStatus({state:'pending',count:-1}),false);
 assert.equal(validStatus({count:0}),false);
 assert.equal(validIntegration({state:'pending',count:0,scope:'本轮尚未复核',model_visual_review:'pending'}),true);
 await assert.rejects(loadJSON('/data/ui-integration-status.json',{fetchImpl:async()=>response({state:'pending',count:0}),validate:validIntegration}),/缺少必要内容/);
 await assert.rejects(loadJSON('/status.json',{fetchImpl:async()=>response('Unavailable',503),validate:validStatus}),error=>error.status===503);
});

test('a slower earlier response cannot replace the later route even if fetch ignores abort',async()=>{
 const requests=createRouteRequests(),first=requests.begin();let release;
 const old=loadJSON('/old',{signal:first.signal,fetchImpl:()=>new Promise(resolve=>release=resolve)});
 const second=requests.begin();assert.equal(first.signal.aborted,true);let page='new article';
 release(response({title:'old article'}));const oldResult=await old;if(first.isCurrent())page=oldResult.title;
 assert.equal(page,'new article');assert.equal(second.isCurrent(),true);requests.cancel();assert.equal(second.isCurrent(),false);
});

test('history identity preserves foreign fields and a new same-article item gets a separate identity',()=>{
 const old={external:'keep',astronomy:{reading:'keep'}};const state=createHistoryState(old,'first');
 assert.deepEqual(state,{external:'keep',astronomy:{reading:'keep',entryId:'first'}});
 const win={history:{state,replaceState(next){this.state=next;}},location:{href:'https://example.test/read/03'}};
 assert.equal(ensureHistoryEntry(win),'first');assert.equal(ensureHistoryEntry(win),'first');
 const newer=createHistoryState();assert.notEqual(newer.astronomy.entryId,state.astronomy.entryId);
});

function fakeStorage(initial=null){let text=initial;return{getItem:()=>text,setItem:(_,value)=>text=value};}
test('two histories of one lesson retain distinct paragraphs across refresh and reject a different route',()=>{
 const storage=fakeStorage(),store=createReadingStore(storage);
 store.save('first','/read/03',{y:1400,block:10,offset:-30,openDetails:[0]});
 store.save('second','/read/03',{y:5200,block:42,offset:-60,openDetails:[]});
 const refreshed=createReadingStore(storage);
 assert.equal(refreshed.get('first','/read/03').y,1400);assert.equal(refreshed.get('second','/read/03').y,5200);
 assert.equal(refreshed.get('first','/read/04'),null);
 const snapshot=refreshed.get('first','/read/03');snapshot.y=2;assert.equal(refreshed.get('first','/read/03').y,1400);
});

test('corrupt/unavailable storage and an invalid offset cannot interrupt navigation',()=>{
 const corrupt=createReadingStore(fakeStorage('{broken'));assert.equal(corrupt.get('x','/read/03'),null);
 const unavailable=createReadingStore({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
 unavailable.save('x','/read/03',{y:1500,block:2,offset:NaN});assert.equal(unavailable.get('x','/read/03').offset,0);
 unavailable.save('broken','/read/03',{y:Infinity});assert.equal(unavailable.get('broken','/read/03'),null);
 const small=createReadingStore(null,2);for(const id of ['first','second','third'])small.save(id,'/read/03',{y:0});assert.equal(small.get('first','/read/03'),null);
});

test('Back/Forward and refresh recover the entry; a fresh anchor navigation follows its explicit anchor',()=>{
 const snapshot={y:3300,block:15,offset:-40};
 for(const kind of ['initial','pop','retry'])assert.equal(restorationTarget({kind,snapshot,hash:'#two-months'}).snapshot.y,3300);
 assert.deepEqual(restorationTarget({kind:'push',snapshot,hash:'#two-months'}),{hash:'#two-months'});
 assert.deepEqual(restorationTarget({kind:'push',snapshot}),{top:true});
 assert.equal(decodeAnchor('#%E6%9C%88%E4%BA%AE'),'月亮');assert.equal(decodeAnchor('#bad%escape'),'bad%escape');
});

class FakeWindow extends EventTarget{
 constructor(){
  super();this.scrollY=0;this.innerHeight=700;this.maxScroll=10000;this.frames=new Map();this.timers=new Map();this.next=0;
  this.document={links:[],anchors:new Map(),querySelectorAll:()=>this.document.links,getElementById:id=>this.document.anchors.get(id)};
  const win=this;this.ResizeObserver=class{constructor(callback){win.resize=callback;}observe(){}disconnect(){win.resize=null;}};
 }
 requestAnimationFrame(callback){const id=++this.next;this.frames.set(id,callback);return id;}
 cancelAnimationFrame(id){this.frames.delete(id);}
 setTimeout(callback,delay){const id=++this.next;this.timers.set(id,{callback,delay});return id;}
 clearTimeout(id){this.timers.delete(id);}
 flushFrames(){const frames=[...this.frames.values()];this.frames.clear();frames.forEach(callback=>callback());}
 scrollTo({top}){this.scrollY=Math.min(this.maxScroll,Math.max(0,top));}
}
class FakeBlock{
 constructor(win,top,height=180){this.win=win;this.top=top;this.height=height;this.dataset={};this.tagName='P';this.parentElement=null;}
 getBoundingClientRect(){return{top:this.top-this.win.scrollY,bottom:this.top+this.height-this.win.scrollY};}
 getClientRects(){return[this.getBoundingClientRect()];}
 closest(){return null;}
}
class FakeRoot{
 constructor(blocks,images=[]){this.blocks=blocks;this.images=images;this.details=[];this.style={overflowAnchor:'auto'};this.isConnected=true;}
 querySelectorAll(selector){return selector==='img'?this.images:selector==='details'?this.details:this.blocks;}
 querySelector(selector){const match=selector.match(/data-reading-block="(\d+)"/);return match?this.blocks.find(block=>block.dataset.readingBlock===match[1]):null;}
}
test('reading restoration follows the same paragraph after delayed image and stylesheet layout',()=>{
 const win=new FakeWindow(),block=new FakeBlock(win,1000),image=new EventTarget(),style=new EventTarget();image.complete=false;style.sheet=null;win.document.links=[style];
 const root=new FakeRoot([block],[image]);indexReadingBlocks(root);win.maxScroll=600;
 const restore=restoreReadingPosition(root,win,{snapshot:{y:1040,block:0,offset:-40}});win.flushFrames();assert.equal(win.scrollY,600);
 block.top=2400;win.maxScroll=4000;image.complete=true;image.dispatchEvent(new Event('load'));win.flushFrames();assert.equal(win.scrollY,2440);
 block.top=2500;style.sheet={};style.dispatchEvent(new Event('load'));win.flushFrames();assert.equal(win.scrollY,2540);
 assert.equal(restore.isPending(),true);restore.cancel();assert.equal(root.style.overflowAnchor,'auto');
});

test('direct Chinese anchor waits for layout; the first user wheel cancels subsequent automatic scrolling',()=>{
 const win=new FakeWindow(),anchor=new FakeBlock(win,2000),image=new EventTarget();image.complete=false;win.document.anchors.set('两种月',anchor);
 const root=new FakeRoot([anchor],[image]);indexReadingBlocks(root);
 const restore=restoreReadingPosition(root,win,{hash:'#%E4%B8%A4%E7%A7%8D%E6%9C%88'});win.flushFrames();assert.equal(win.scrollY,1976);
 anchor.top=3000;image.complete=true;image.dispatchEvent(new Event('load'));win.flushFrames();assert.equal(win.scrollY,2976);
 win.dispatchEvent(new Event('wheel'));assert.equal(restore.isPending(),false);win.scrollY=3200;anchor.top=4000;image.dispatchEvent(new Event('load'));win.flushFrames();assert.equal(win.scrollY,3200);
});

test('capturing uses an on-screen paragraph and retains open reading disclosures',()=>{
 const win=new FakeWindow();win.scrollY=1600;const before=new FakeBlock(win,1000),visible=new FakeBlock(win,1500),later=new FakeBlock(win,1900);
 const root=new FakeRoot([before,visible,later]);root.details=[{open:true},{open:false}];indexReadingBlocks(root);
 assert.deepEqual(captureReadingPosition(root,win),{y:1600,block:1,offset:-100,openDetails:[0]});
});
