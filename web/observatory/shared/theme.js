// Runs before styles in all three documents. A preference changes presentation
// only; it never enters experiment snapshots, routes or scientific controls.
(() => {
 if(globalThis.AstronomyLabTheme||!globalThis.document)return;
 const doc=globalThis.document,key='astronomy-lab-theme';
 const valid=value=>value==='light'||value==='dark';
 const media=globalThis.matchMedia?.('(prefers-color-scheme: dark)');
 const read=()=>{try{const value=globalThis.localStorage.getItem(key);return valid(value)?value:null;}catch{return undefined;}};
 let preference=read()??null,theme=preference||(media?.matches?'dark':'light');
 function syncRoute(href=globalThis.location.href){
  const url=new URL(href,globalThis.location.href);
  doc.documentElement.dataset.alThemeScope=url.pathname==='/'?'home':'tools';
  doc.documentElement.dataset.alTheme=theme;
 }
 function publish(next){
  const changed=theme!==next;theme=next;syncRoute();
  if(changed)globalThis.dispatchEvent(new CustomEvent('al-theme-change',{detail:{theme}}));
 }
 function set(next){
  if(!valid(next))throw new TypeError('Unknown display theme');
  preference=next;try{globalThis.localStorage.setItem(key,next);}catch{}
  publish(next);
 }
 globalThis.addEventListener('storage',event=>{
  if(event.key!==key&&event.key!==null)return;
  preference=valid(event.newValue)?event.newValue:null;
  publish(preference||(media?.matches?'dark':'light'));
 });
 media?.addEventListener('change',()=>{if(!preference)publish(media.matches?'dark':'light');});
 globalThis.addEventListener('pageshow',()=>{const stored=read();if(stored!==undefined)preference=stored;publish(preference||(media?.matches?'dark':'light'));});
 Object.defineProperty(globalThis,'AstronomyLabTheme',{value:Object.freeze({get:()=>theme,set,syncRoute}),writable:false,configurable:false});
 syncRoute();
})();
