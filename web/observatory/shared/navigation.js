import {prepareEditorial} from './editorial.js';
import {editorialLegacy} from './editorial-labs.js';
import {labs as registry,topics,labURL} from './course-map.js';
import {enterLegacyMode} from './mode-entry.js';
export function navigation(active=''){
 const host=document.getElementById('site-navigation');if(!host)return;
 const labs=registry.map(l=>[labURL(l.slug),l.title]);
 const inLab=labs.some(([url])=>location.pathname===url);
 host.innerHTML=`<nav class="global-nav" aria-label="网站导航"><a class="site-brand" href="/"><span aria-hidden="true">◐</span><span>天文学实验室</span></a><div class="global-links"><a href="/" ${active==='home'?'aria-current="page"':''}>知识地图</a><details class="nav-dropdown"><summary ${inLab?'class="active"':''}>实验室</summary><div>${topics.map(t=>`<section class="nav-theme"><h2>${t.name}</h2>${registry.filter(l=>l.topic===t.key).map(l=>`<a href="${labURL(l.slug)}" ${location.pathname===labURL(l.slug)?'aria-current="page"':''}>${l.title}</a>`).join('')}</section>`).join('')}</div></details><a href="/courses" ${active==='courses'?'aria-current="page"':''}>16讲全文</a><a href="/materials" ${active==='materials'?'aria-current="page"':''}>素材库</a><a href="/sources" ${active==='sources'?'aria-current="page"':''}>来源与模型</a></div></nav>`;
 host.onkeydown=e=>{if(e.key==='Escape'){host.querySelector('.nav-dropdown')?.removeAttribute('open');host.querySelector('summary')?.focus();}};
}
document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown'))document.querySelector('.nav-dropdown')?.removeAttribute('open');});
if(document.body.classList.contains('integrated-legacy')||!document.getElementById('app')){navigation();prepareEditorial();if(document.body.classList.contains('editorial')){document.querySelector('.site-brand>span:first-child')?.remove();document.querySelector('.global-links>a').textContent='首页';editorialLegacy();}}
enterLegacyMode();
