import {prepareEditorial,applyEditorial} from './shared/editorial.js';
import {navigation} from './shared/navigation.js';
import {mountHome} from './shared/home.js';
import {labs,topics,confirmedModes,labURL} from './shared/tool-registry.js';
import {getModeContext} from './shared/mode-context.js';
import {enterMode} from './shared/mode-entry.js';
import {createRouteRequests} from './shared/tool-load.js';
import {createHistoryState,routeAddress} from './shared/tool-history.js';
import {captureExperiment,restoreExperiment,bindExperimentState,ensureExperimentEntry,currentExperimentMode} from './shared/experiment-state.js';
const app=document.getElementById('app'),requests=createRouteRequests();let cleanup=null,activePage=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{history.scrollRestoration='manual';}catch{}
function home(){document.title='天文学实验室 · 工具目录';cleanup=mountHome(app,{labs,topics,labURL,esc});}
function sources(){document.title='模型与来源 · 天文学实验室';app.innerHTML=`<div class="entry-sources"><header class="entry-sources-header"><a class="entry-back" href="/">← 全部工具</a><h1>模型与来源</h1></header><div class="entry-source-topics">${topics.map(t=>`<section class="entry-source-topic" aria-labelledby="source-${t.key}"><h2 id="source-${t.key}">${esc(t.name)}</h2><div>${labs.filter(l=>l.topic===t.key).map(l=>`<section class="entry-source-tool"><h3><a href="${labURL(l.slug)}">${esc(l.title)} <span aria-hidden="true">↗</span></a></h3><a class="entry-source-link" aria-label="${esc(l.title)}：计算方法与来源" href="${l.entry.startsWith('/labs/')?l.entry+'SOURCES.md':'/sources/'+l.slug+'.md'}" target="_blank" rel="noopener">计算方法与来源 ↗</a></section>`).join('')}</div></section>`).join('')}</div><section class="entry-source-images"><h2>首页图像</h2><p>上弦月：NASA Scientific Visualization Studio 科学可视化渲染。<a href="https://svs.gsfc.nasa.gov/5587/" target="_blank" rel="noopener">来源 ↗</a> · <a href="https://www.nasa.gov/nasa-brand-center/images-and-media/" target="_blank" rel="noopener">使用说明 ↗</a></p><p>创生之柱：NIRCam 与 MIRI 红外合成。NASA, ESA, CSA, STScI, J. DePasquale (STScI), A. Pagan (STScI), A. M. Koekemoer (STScI)。<a href="https://esawebb.org/images/pillarsofcreation_composite/" target="_blank" rel="noopener">来源 ↗</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0 ↗</a></p></section></div>`;}
function saveActive(){if(activePage?.experiment)captureExperiment(activePage.experiment.slug,activePage.experiment.root,{entryId:activePage.id});}
function showFailure(error){cleanup?.();cleanup=null;globalThis.AstronomyLabPresentationRoutes?.clear();app.dataset.page='error';app.removeAttribute('aria-busy');if(activePage)activePage.experiment=null;app.innerHTML=`<section class="load-error" role="alert"><h1>当前工具暂时无法载入</h1><p class="error">请重新加载页面，或从目录打开其他工具。</p><div class="button-row"><button class="al-button" data-retry>重试</button><a href="/">工具目录 →</a><a href="/sources">来源与说明 →</a></div></section>`;app.querySelector('[data-retry]').addEventListener('click',()=>location.reload());}
async function lab(slug,scope,context){
 const l=labs.find(l=>l.slug===slug);if(!l||l.entry.startsWith('/labs/'))throw Error('找不到这个工具。');document.title=l.title+' · 天文学实验室';
 app.innerHTML=`<header class="tool-heading"><a href="/">← 工具目录</a><h1>${esc(l.title)}</h1><a href="/sources/${slug}.md" target="_blank" rel="noopener">模型与来源 ↗</a></header><div id="mode-context" class="tool-mode-context"></div><div id="lab-mount"><p class="loading" role="status">正在载入工具…</p></div>`;
 const module=await import(`/modules/${slug==='imaging'?'imaging-page':slug}.js`);if(!scope.isCurrent())return;
 await globalThis.AstronomyLabPresentationRoutes?.loadStyles(context.url.href);if(!scope.isCurrent())return;
 const host=app.querySelector('#lab-mount');host.innerHTML='';const requested=context.url.searchParams.get('mode'),mode=confirmedModes[slug]?.includes(requested)?requested:undefined;
 const result=await module.mount(host,{mode,signal:scope.signal}),dispose=typeof result==='function'?result:()=>result?.dispose?.();if(!scope.isCurrent()){dispose();return;}let unbind=null;cleanup=()=>{unbind?.();dispose();};context.experiment={slug,root:host,api:result};enterMode(slug,mode,host);await restoreExperiment(slug,host,{mode,entryId:context.id});if(!scope.isCurrent())return;
 const explain=current=>{const c=getModeContext(slug,current),panel=app.querySelector('#mode-context');if(!c||!panel)return;const guide=host.querySelector('[data-learning-guide],.sky-guide,.optics-guide,.light-question,.stars-question,.galaxy-head,.orbits-guide,.measure-guide,.alignment-guide,.imaging-guide');panel.innerHTML=(guide||slug==='imaging')?'':`<p data-learning-question>${esc(c.question)}</p><p data-learning-instruction>${esc(c.action)} ${esc(c.observe)}</p>`;let boundary=host.querySelector('[data-mode-boundary]');if(!boundary){boundary=document.createElement('p');boundary.dataset.modeBoundary='';boundary.className='tool-model-boundary';host.append(boundary);}if(slug!=='imaging')boundary.textContent=c.boundary;boundary.hidden=slug==='sky'&&current==='calendar';};
 unbind=bindExperimentState(slug,host,{entryId:context.id,onModeChange:explain});explain(currentExperimentMode(slug,host)||mode||confirmedModes[slug][0]);
}
async function route(kind='push',{skipOutgoingSave=false}={}){
 if(!skipOutgoingSave)saveActive();activePage=null;cleanup?.();cleanup=null;
 const scope=requests.begin(),url=new URL(location.href),path=url.pathname,context={id:ensureExperimentEntry(window),href:routeAddress(url),url,kind};activePage=context;
 try{
  globalThis.AstronomyLabPresentationRoutes?.apply(url.href);prepareEditorial();
  const nav=document.getElementById('site-navigation');if(nav)nav.dataset.alSurface=path==='/'?'scene':'paper';
  navigation(path==='/'?'home':path.slice(1));app.dataset.page='loading';app.setAttribute('aria-busy','true');app.innerHTML='<p class="loading" role="status">正在载入工具…</p>';window.scrollTo({top:0,left:0,behavior:'instant'});
  app.dataset.page=path==='/'?'home':path.startsWith('/lab/')?'lab':path.slice(1);
  if(path==='/')home();else if(path==='/sources')sources();else if(/^\/lab\/[a-z-]+$/.test(path))await lab(path.split('/')[2],scope,context);else throw Error('找不到这个工具入口。');
  if(!scope.isCurrent())return;
  const before=cleanup,layout=applyEditorial(app);cleanup=()=>{layout?.();before?.();};app.removeAttribute('aria-busy');
  if(path==='/'&&url.hash==='#tools')requestAnimationFrame(()=>{if(scope.isCurrent())app.querySelector('#tools')?.scrollIntoView({block:'start'});});
 }catch(error){if(scope.isCurrent()&&error.name!=='AbortError')showFailure(error);}finally{if(scope.isCurrent())app.removeAttribute('aria-busy');}
}
const isAppPath=p=>['/','/sources'].includes(p)||/^\/lab\/[a-z-]+$/.test(p);
document.addEventListener('click',event=>{const a=event.target.closest('a');if(!a||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||a.target||a.hasAttribute('download'))return;const url=new URL(a.href,location.href);if(url.origin!==location.origin)return;
 if(url.pathname===location.pathname&&url.search===location.search&&url.hash==='#tools'){const target=document.getElementById('tools');if(target){event.preventDefault();history.replaceState(history.state,'',url);target.scrollIntoView({block:'start'});target.focus({preventScroll:true});return;}}
 saveActive();const ui=new URLSearchParams(location.search).get('ui');if(!isAppPath(url.pathname)){if(url.pathname.startsWith('/labs/')&&ui&&!url.searchParams.has('ui')){event.preventDefault();url.searchParams.set('ui',ui);location.assign(url.href);}return;}event.preventDefault();if(ui&&!url.searchParams.has('ui'))url.searchParams.set('ui',ui);document.querySelector('.nav-dropdown')?.removeAttribute('open');history.pushState(createHistoryState(),'',url);void route('push');});
window.addEventListener('pagehide',()=>{saveActive();requests.cancel();cleanup?.();cleanup=null;});window.addEventListener('popstate',()=>void route('pop'));window.addEventListener('pageshow',e=>{if(e.persisted)void route('initial',{skipOutgoingSave:true});});void route('initial').catch(showFailure);
