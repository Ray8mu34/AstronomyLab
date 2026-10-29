// DOM, SVG and Canvas share the CSS token owner. This module never owns a
// scientific parameter, coordinate transform, clock, or experiment snapshot.
const observers=new WeakMap(),registrations=new WeakMap(),documents=new WeakMap();
const allowedSurfaces=new Set(['paper','scene','image','hr']);
const activePresentations=new WeakMap();
const surfaceScopes=new WeakMap(),presentationRenderers=new WeakMap();

const attribute=(element,name,value)=>value===null?element.removeAttribute(name):element.setAttribute(name,value);
function updateScope(element,token,layer){
 let scope=surfaceScopes.get(element);
 if(!scope){if(!layer)return;scope={surface:element.getAttribute('data-al-surface'),owner:element.getAttribute('data-presentation-owner'),classed:element.classList.contains('al-surface'),layers:new Map()};surfaceScopes.set(element,scope);}
 if(layer)scope.layers.set(token,layer);else scope.layers.delete(token);
 const latest=[...scope.layers.values()].at(-1),owns=[...scope.layers.values()].some(item=>item.owner);
 attribute(element,'data-al-surface',latest?.surface??scope.surface);
 attribute(element,'data-presentation-owner',owns?'atlas':scope.owner);
 element.classList.toggle('al-surface',owns||scope.classed);
 if(!scope.layers.size)surfaceScopes.delete(element);
}
function updateDocumentSurface(doc,active){
 const entries=[...active.entries.values()].filter(entry=>entry.root.isConnected&&!entry.root.closest('[hidden]'));
 if(entries.length){const latest=entries.at(-1),surface=latest.root.dataset.alSurface||latest.surface;doc.body.dataset.alSurface=surface;doc.documentElement.dataset.alSurface=surface;doc.body.classList.remove('editorial-legacy');return;}
 const url=new URL(doc.defaultView.location.href),route=doc.defaultView.AstronomyLabPresentationRoutes?.resolve(url.href);
 const appRoute=url.pathname==='/'||url.pathname==='/sources'||url.pathname.startsWith('/lab/');
 attribute(doc.body,'data-al-surface',appRoute&&route?route.surface:active.bodySurface);
 attribute(doc.documentElement,'data-al-surface',appRoute&&route?route.surface:active.htmlSurface);
 const modern=[...doc.querySelectorAll('[data-presentation-owner]')].some(node=>!node.closest('[hidden]'));
 const legacy=active.legacy&&url.pathname.startsWith('/lab/')&&url.searchParams.get('ui')!=='classic'&&route?.layout!=='workspace'&&!modern;
 doc.body.classList.toggle('editorial-legacy',legacy);
}

export function bindDisclosures(root){
 const opened=[...root.querySelectorAll('details[open]')];
 const toggle=event=>{const detail=event.target;if(detail.tagName!=='DETAILS')return;const index=opened.indexOf(detail);if(index>=0)opened.splice(index,1);if(detail.open)opened.push(detail);};
 const keydown=event=>{
  if(event.key!=='Escape'||event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey)return;
  const target=event.target;
  // Native edit/select and modal keyboard behavior retain their own owner.
  if(target.closest('input:not([type="range"]),select,textarea,[contenteditable="true"],dialog[open]'))return;
  const focused=target.closest('details[open]');
  const detail=focused&&root.contains(focused)?focused:[...opened].reverse().find(node=>node.open&&root.contains(node));
  if(!detail)return;
  detail.open=false;detail.querySelector(':scope > summary')?.focus({preventScroll:true});event.preventDefault();event.stopPropagation();
 };
 root.addEventListener('toggle',toggle,true);root.addEventListener('keydown',keydown);
 return()=>{root.removeEventListener('toggle',toggle,true);root.removeEventListener('keydown',keydown);opened.length=0;};
}

export function getGraphicStyle(element){
 const doc=element.ownerDocument,win=doc.defaultView,computed=win.getComputedStyle(element);
 const value=name=>computed.getPropertyValue('--al-'+name).trim();
 const rootSize=parseFloat(win.getComputedStyle(doc.documentElement).fontSize)||16;
 const size=name=>{const raw=value(name);return parseFloat(raw)*(raw.endsWith('rem')?rootSize:1);};
 const fontFamily=value('font'),numericFamily=value('numeric'),fontSize=size('body'),labelSize=size('label'),tickSize=size('tick'),readoutSize=size('readout');
 return {
  background:value('page'),text:value('text'),muted:value('muted'),grid:value('line'),accent:value('reference'),focus:value('focus'),error:value('error'),
  gold:value('series-gold'),teal:value('series-teal'),blue:value('series-blue'),green:value('series-green'),warm:value('series-warm'),purple:value('series-purple'),
  fontFamily,numericFamily,fontSize,labelSize,tickSize,readoutSize,
  bodyFont:`400 ${fontSize}px ${fontFamily}`,labelFont:`400 ${labelSize}px ${fontFamily}`,tickFont:`400 ${tickSize}px ${numericFamily}`,readoutFont:`400 ${readoutSize}px ${numericFamily}`,
  lineWidth:Number(value('plot-line-width')),referenceWidth:Number(value('plot-reference-width')),pointRadius:Number(value('plot-point-radius')),
 };
}

function documentObserver(doc){
 if(documents.has(doc))return documents.get(doc);
 const refs=new Set();let frame=0;
 const refresh=()=>{if(frame)return;frame=doc.defaultView.requestAnimationFrame(()=>{
  frame=0;for(const ref of refs){const element=ref.deref();if(!element){refs.delete(ref);continue;}if(element.isConnected)observers.get(element)?.();}
 });};
 const entry={refs,refresh};documents.set(doc,entry);
 doc.fonts?.addEventListener('loadingdone',refresh);
 doc.defaultView.addEventListener('al-theme-change',refresh);
 doc.fonts?.ready.then(refresh);
 return entry;
}

export function observeGraphicFonts(element,redraw){
 const entry=documentObserver(element.ownerDocument),{refs}=entry;
 // Weak references keep disposed/detached experiments out of the font owner.
 // The callback is held only in a WeakMap keyed by its rendering element.
 for(const ref of refs)if(!ref.deref())refs.delete(ref);
 const old=registrations.get(element);if(old)old.refs.delete(old.ref);
 const ref=new WeakRef(element);refs.add(ref);observers.set(element,redraw);registrations.set(element,{ref,refs});
 const fonts=element.ownerDocument.fonts;
 if(fonts){const style=getGraphicStyle(element);Promise.all([fonts.load(style.labelFont,'月相'),fonts.load(style.tickFont,'0123−μ')]).then(entry.refresh).catch(()=>{});}
 let active=true;
 return()=>{if(!active)return;active=false;refs.delete(ref);if(registrations.get(element)?.ref===ref){registrations.delete(element);observers.delete(element);}};
}

export function applyPresentation(root,{surface='paper',redraw}={}){
 if(!allowedSurfaces.has(surface))throw new TypeError('Unknown presentation surface');
 const doc=root.ownerDocument,host=root.closest('#lab-mount'),token=Symbol('presentation');
 let active=activePresentations.get(doc);if(!active){active={entries:new Map(),legacy:doc.body.classList.contains('editorial-legacy'),bodySurface:doc.body.getAttribute('data-al-surface'),htmlSurface:doc.documentElement.getAttribute('data-al-surface')};activePresentations.set(doc,active);}
 updateScope(root,token,{surface,owner:true});if(host&&host!==root)updateScope(host,token,{surface,owner:false});
 active.entries.set(token,{root,surface});updateDocumentSurface(doc,active);
 let renderer=presentationRenderers.get(root);if(!renderer){renderer={entries:new Map(),stop:null};presentationRenderers.set(root,renderer);}
 renderer.entries.set(token,redraw);
 if(redraw&&!renderer.stop)renderer.stop=observeGraphicFonts(root,()=>{if(!root.closest('[hidden]'))[...renderer.entries.values()].at(-1)?.();});
 let mounted=true;
 return()=>{if(!mounted)return;mounted=false;renderer.entries.delete(token);if(!renderer.entries.size){renderer.stop?.();presentationRenderers.delete(root);}updateScope(root,token,null);if(host&&host!==root)updateScope(host,token,null);active.entries.delete(token);updateDocumentSurface(doc,active);if(!active.entries.size)activePresentations.delete(doc);};
}
