// Small synchronous shell declaration. The science registry remains authoritative;
// integration checks each declaration's IDs/default against tool-registry.js.
(() => {
  const declare=(defaultMode,knownModes,surfaces,styles)=>Object.freeze({defaultMode,knownModes:Object.freeze(knownModes),surfaces:Object.freeze(surfaces),styles:Object.freeze(styles.map(file=>'/modules/'+file))});
  const declarations=Object.freeze({
    alignments:declare('venus',['venus','mars','transit'],{venus:'scene',mars:'scene',transit:'scene'},['alignments-atlas-ui.css']),
    sky:declare('sky',['sky','stars','measure','calendar','day','precession'],{sky:'scene',stars:'scene',measure:'scene',calendar:'paper',day:'scene',precession:'scene'},['sky-presentation.css']),
    optics:declare('imaging',['imaging','resolution','sampling'],{imaging:'image',resolution:'image',sampling:'image'},['optics-pilot.css','optics-sampling-ui.css']),
    imaging:declare('real',['real','teaching'],{real:'image',teaching:'image'},['imaging-pilot.css']),
    light:declare('thermal',['thermal','motion','magnitude','observing'],{thermal:'paper',motion:'scene',magnitude:'paper',observing:'paper'},['light-presentation.css','light-thermal-ui.css','light-motion-ui.css','light-magnitude-ui.css','light-observing-ui.css']),
    stars:declare('hr',['hr','evolution','pulsar','collapse','ia'],{hr:'hr',evolution:'scene',pulsar:'scene',collapse:'scene',ia:'paper'},['stars-pilot.css','stars-hr-ui.css','stars-atlas.css','stars-light-focus.css']),
    measure:declare('shadow',['shadow','jupiter','s2','distance'],{shadow:'scene',jupiter:'scene',s2:'scene',distance:'paper'},['measure-pilot.css','measure-atlas.css']),
    orbits:declare('orbit',['orbit','transfer','staging','landing'],{orbit:'scene',transfer:'scene',staging:'paper',landing:'paper'},['orbits-pilot.css','orbit-conics.css','landing-staging-lab.css','orbits-transfer-ui.css']),
    galaxy:declare('galaxy',['galaxy','cmb','cmb-spectrum'],{galaxy:'scene',cmb:'image','cmb-spectrum':'paper'},['galaxy-pilot.css','galaxy-galaxy-ui.css','galaxy-cmb-ui.css','galaxy-cmb-spectrum-ui.css']),
  });
  const styleRequests=new WeakMap();
  function resolve(href){
    const url=new URL(href,globalThis.location?.href||'http://local.invalid/');
    const match=/^\/lab\/([a-z-]+)$/.exec(url.pathname),slug=match?.[1],declaration=declarations[slug];
    const requested=url.searchParams.get('mode');
    const mode=declaration?(declaration.knownModes.includes(requested)?requested:declaration.defaultMode):null;
    const surface=url.searchParams.get('ui')!=='classic'&&declaration?.surfaces[mode];
    return {layout:surface?'workspace':'standard',surface:surface||'paper',slug:slug||null,mode};
  }
  function apply(href,doc=globalThis.document){
    const result=resolve(href);
    if(doc){doc.documentElement.dataset.alRouteLayout=result.layout;doc.documentElement.dataset.alSurface=result.surface;if(doc.body)doc.body.dataset.alSurface=result.surface;}
    return result;
  }
  function loadStyle(path,doc){
    let requests=styleRequests.get(doc);if(!requests){requests=new Map();styleRequests.set(doc,requests);}
    const href=new URL(path,doc.baseURI).href;if(requests.has(href))return requests.get(href);
    let link=[...doc.querySelectorAll('link[rel="stylesheet"]')].find(node=>node.href===href);
    if(link?.sheet)return Promise.resolve(link);
    const created=!link;if(!link){link=doc.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.presentationStyle='';}
    const request=new Promise((resolve,reject)=>{
      const finish=error=>{clearTimeout(timer);link.removeEventListener('load',loaded);link.removeEventListener('error',failed);if(error){requests.delete(href);link.remove();reject(error);}else resolve(link);};
      const loaded=()=>finish(),failed=()=>finish(new Error('样式资源未能载入：'+path));
      const timer=setTimeout(()=>finish(new Error('样式资源载入超时：'+path)),15000);
      link.addEventListener('load',loaded,{once:true});link.addEventListener('error',failed,{once:true});if(created)doc.head.append(link);
    });
    requests.set(href,request);return request;
  }
  function loadStyles(href,doc=globalThis.document){
    const route=resolve(href);if(!doc||route.layout!=='workspace')return Promise.resolve([]);
    return Promise.all(declarations[route.slug].styles.map(path=>loadStyle(path,doc)));
  }
  function clear(doc=globalThis.document){
    if(!doc)return;
    doc.documentElement.dataset.alRouteLayout='standard';doc.documentElement.dataset.alSurface='paper';
    if(doc.body)doc.body.dataset.alSurface='paper';
  }
  Object.defineProperty(globalThis,'AstronomyLabPresentationRoutes',{value:Object.freeze({declarations,resolve,apply,loadStyles,clear}),configurable:false,writable:false});
  if(globalThis.document)apply(globalThis.location.href);
})();
