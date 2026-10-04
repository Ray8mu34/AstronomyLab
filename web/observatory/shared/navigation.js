import {prepareEditorial} from './editorial.js';
import {editorialLegacy} from './editorial-labs.js';
import {labs as registry,topics,labURL,confirmedModes} from './course-map.js';
import {learningPaths,pathsForExperiment,readingURL} from './learning-paths.js';
import {initializeLegacyExperiment} from './experiment-state.js';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function navigationURL(href,current=globalThis.location?.href){
 const base=new URL(current||'http://local.invalid/'),url=new URL(href,base);
 if(base.searchParams.get('ui')==='classic'&&url.origin===base.origin)url.searchParams.set('ui','classic');
 return url.origin===base.origin?url.pathname+url.search+url.hash:url.href;
}
export function experimentReadingPaths(slug,mode,url=globalThis.location?.href){
 const paths=pathsForExperiment(slug,mode),from=new URL(url||'/', 'http://local.invalid').searchParams.get('from');
 const origin=learningPaths.find(path=>path.id===from&&path.slug===slug);
 return origin?[origin,...paths.filter(path=>path.id!==origin.id)]:paths;
}
export function updateExperimentReadingLinks(slug,mode){
 const lab=registry.find(l=>l.slug===slug);if(!lab)return;
 let host;
 if(document.body.classList.contains('integrated-legacy')){
  host=document.querySelector('[data-experiment-reading-links]');
  if(!host){host=document.createElement('div');host.className='lab-reading-links';host.dataset.experimentReadingLinks='';document.getElementById('site-navigation')?.after(host);}
 }else host=document.querySelector('#app[data-page="lab"] > .lab-reading-links');
 if(!host)return;
 const paths=experimentReadingPaths(slug,mode);
 const links=paths.map(path=>({id:path.id,href:navigationURL(readingURL(path)),label:path.label})),signature=JSON.stringify(links),existing=host.querySelector('[data-segment-links]');
 // Capture events also fire for clicks on these anchors. Keep identical nodes
 // attached so their pending native navigation (and keyboard focus) survives.
 if(existing?.dataset.segmentSignature!==signature){
  existing?.remove();
  if(links.length){const segments=document.createElement('nav');segments.className='button-row';segments.dataset.segmentLinks='';segments.dataset.segmentSignature=signature;segments.setAttribute('aria-label','对应文章段落');
   segments.innerHTML=links.map((path,i)=>`<a data-reading-return="${escape(path.id)}" href="${escape(path.href)}">${i===0?'读这一段':'相关段落'} · ${escape(path.label)} →</a>`).join('');host.prepend(segments);}
 }
 // Legacy pages have their own embedded readings; the unified full-article
 // links remain available beside the segment return in the same navigation.
 if(document.body.classList.contains('integrated-legacy')&&!host.querySelector('[data-full-article-links]')){
  const full=document.createElement('nav');full.dataset.fullArticleLinks='';full.className='button-row';full.setAttribute('aria-label','完整文章');full.innerHTML=lab.lessons.map(n=>`<a href="${escape(navigationURL('/read/'+String(n).padStart(2,'0')))}">第${String(n).padStart(2,'0')}讲 · 完整文章 ↗</a>`).join('');host.append(full);
 }
}
export function navigation(active=''){
 const host=document.getElementById('site-navigation');if(!host)return;
 const labs=registry.map(l=>[labURL(l.slug),l.title]);
 const inLab=labs.some(([url])=>location.pathname===url);
 host.innerHTML=`<nav class="global-nav" aria-label="网站导航"><a class="site-brand" href="/"><span aria-hidden="true">◐</span><span>天文学实验室</span></a><div class="global-links"><a href="/" ${active==='home'?'aria-current="page"':''}>知识地图</a><details class="nav-dropdown"><summary ${inLab?'class="active"':''}>实验室</summary><div>${topics.map(t=>`<section class="nav-theme"><h2>${t.name}</h2>${registry.filter(l=>l.topic===t.key).map(l=>`<a href="${labURL(l.slug)}" ${location.pathname===labURL(l.slug)?'aria-current="page"':''}>${l.title}</a>`).join('')}</section>`).join('')}</div></details><a href="/courses" ${active==='courses'?'aria-current="page"':''}>16讲全文</a><a href="/materials" ${active==='materials'?'aria-current="page"':''}>素材库</a><a href="/sources" ${active==='sources'?'aria-current="page"':''}>来源与模型</a></div></nav>`;
 if(new URLSearchParams(location.search).get('ui')==='classic')for(const link of host.querySelectorAll('a[href]'))link.setAttribute('href',navigationURL(link.getAttribute('href')));
 host.onkeydown=e=>{if(e.key==='Escape'){host.querySelector('.nav-dropdown')?.removeAttribute('open');host.querySelector('summary')?.focus();}};
}
document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown'))document.querySelector('.nav-dropdown')?.removeAttribute('open');});
if(document.body.classList.contains('integrated-legacy')||!document.getElementById('app')){navigation();prepareEditorial();if(document.body.classList.contains('editorial')){document.querySelector('.site-brand>span:first-child')?.remove();document.querySelector('.global-links>a').textContent='首页';editorialLegacy();}}
document.addEventListener('experimentstatechange',event=>{const {slug,mode}=event.detail||{};if(slug&&mode)updateExperimentReadingLinks(slug,mode);});
const legacy=/^\/labs\/(solar-system|earth-moon)\/(?:index\.html)?$/.exec(location.pathname);
if(legacy){
 const requested=new URLSearchParams(location.search).get('mode');
 updateExperimentReadingLinks(legacy[1],confirmedModes[legacy[1]].includes(requested)?requested:confirmedModes[legacy[1]][0]);
 let abort,dispose=()=>{};
 const start=()=>{abort=new AbortController();const signal=abort.signal;initializeLegacyExperiment(legacy[1],document.body,{signal}).then(cleanup=>{if(signal.aborted)cleanup();else dispose=cleanup;});};
 start();window.addEventListener('pagehide',()=>{abort.abort();dispose();});
 // Reuse the browser's intact page on a back/forward-cache return. Replay the
 // saved controls paused and bind this entry again without forcing a reload.
 window.addEventListener('pageshow',event=>{if(event.persisted)start();});
}
