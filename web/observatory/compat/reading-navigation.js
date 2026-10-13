// Optional reading compatibility. Never imported by the tool runtime.
import {labs as registry,lessonEntries} from '../shared/course-map.js';
import {learningPaths,pathsForExperiment,readingURL} from '../shared/learning-paths.js';
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
  const full=document.createElement('nav');full.dataset.fullArticleLinks='';full.className='button-row';full.setAttribute('aria-label','完整文章');full.innerHTML=Object.entries(lessonEntries).filter(([,entry])=>entry.targets.some(t=>t.slug===slug)).map(([n])=>`<a href="${escape(navigationURL('/read/'+String(n).padStart(2,'0')))}">第${String(n).padStart(2,'0')}讲 · 完整文章 ↗</a>`).join('');host.append(full);
 }
}
