import {labs,topics,labURL} from './tool-registry.js';
export function navigationURL(href,current=globalThis.location?.href){const base=new URL(current||'http://local.invalid/'),url=new URL(href,base);if(base.searchParams.get('ui')==='classic'&&url.origin===base.origin)url.searchParams.set('ui','classic');return url.origin===base.origin?url.pathname+url.search+url.hash:url.href;}
export function navigation(active=''){
 const host=document.getElementById('site-navigation');if(!host)return;
 host.innerHTML=`<nav class="global-nav" aria-label="工具导航"><a class="site-brand" href="/">天文学实验室</a><div class="global-links"><a href="/" ${active==='home'?'aria-current="page"':''}>演示工具</a><details class="nav-dropdown"><summary>工具目录</summary><div>${topics.map(t=>`<section class="nav-theme"><h2>${t.name}</h2>${labs.filter(l=>l.topic===t.key).map(l=>`<a href="${labURL(l.slug)}" ${location.pathname===labURL(l.slug)?'aria-current="page"':''}>${l.title}</a>`).join('')}</section>`).join('')}</div></details><a href="/sources" ${active==='sources'?'aria-current="page"':''}>来源与说明</a></div></nav>`;
 if(new URLSearchParams(location.search).get('ui')==='classic')for(const link of host.querySelectorAll('a[href]'))link.setAttribute('href',navigationURL(link.getAttribute('href')));
 host.onkeydown=e=>{if(e.key==='Escape'){const d=host.querySelector('.nav-dropdown');if(d?.open){d.open=false;d.querySelector('summary').focus();e.preventDefault();}}};
}
document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown'))document.querySelector('.nav-dropdown')?.removeAttribute('open');});
