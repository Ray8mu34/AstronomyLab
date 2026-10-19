import {labs,topics,labURL} from './tool-registry.js';
const siteTitle='天文学实验室',workspaces=new WeakMap();
// The compact variant uses the same source for the home/brand link and moves
// native mode/actions instead of cloning their event or scientific owners.
export function mountWorkspaceNavigation(container,{modeNav,actions=[],source=null,label='实验导航'}={}){
 const doc=container.ownerDocument;workspaces.get(doc)?.();const focused=doc.activeElement;
 const header=doc.createElement('nav');header.className='al-workspace-navigation';header.setAttribute('aria-label',label);
 const brand=doc.createElement('a');brand.href=navigationURL('/',doc.defaultView.location.href);brand.className='al-workspace-brand';brand.textContent=siteTitle;header.append(brand);
 const modes=doc.createElement('div');modes.className='al-workspace-modes';header.append(modes);
 const tools=doc.createElement('div');tools.className='al-workspace-actions';header.append(tools);
 const moved=[],restore=[];
 const move=(node,target)=>{if(!node)return;const marker=doc.createComment('workspace navigation');node.before(marker);moved.push([node,marker]);target.append(node);};
 move(modeNav,modes);for(const node of actions)move(node,tools);
 const heading=doc.querySelector('.tool-heading');source??=heading?.querySelector('a[target="_blank"]');move(source,tools);
 for(const node of [doc.getElementById('site-navigation'),heading])if(node&&!container.contains(node)){restore.push([node,node.hidden]);node.hidden=true;}
 container.prepend(header);if(header.contains(focused))focused.focus({preventScroll:true});let active=true;
 const dispose=()=>{if(!active)return;active=false;const returning=header.contains(doc.activeElement)?doc.activeElement:null;for(const [node,marker]of moved)if(marker.parentNode)marker.replaceWith(node);for(const [node,hidden]of restore)node.hidden=hidden;header.remove();if(returning?.isConnected&&!returning.closest('[hidden]'))returning.focus({preventScroll:true});if(workspaces.get(doc)===dispose)workspaces.delete(doc);};
 workspaces.set(doc,dispose);return dispose;
}
export function navigationURL(href,current=globalThis.location?.href){const base=new URL(current||'http://local.invalid/'),url=new URL(href,base);if(base.searchParams.get('ui')==='classic'&&url.origin===base.origin)url.searchParams.set('ui','classic');return url.origin===base.origin?url.pathname+url.search+url.hash:url.href;}
export function navigation(active=''){
 const host=document.getElementById('site-navigation');if(!host)return;
 host.innerHTML=`<nav class="global-nav" aria-label="工具导航"><a class="site-brand" href="/">${siteTitle}</a><div class="global-links"><a href="/" ${active==='home'?'aria-current="page"':''}>演示工具</a><details class="nav-dropdown"><summary>工具目录</summary><div>${topics.map(t=>`<section class="nav-theme"><h2>${t.name}</h2>${labs.filter(l=>l.topic===t.key).map(l=>`<a href="${labURL(l.slug)}" ${location.pathname===labURL(l.slug)?'aria-current="page"':''}>${l.title}</a>`).join('')}</section>`).join('')}</div></details><a href="/sources" ${active==='sources'?'aria-current="page"':''}>来源与说明</a></div></nav>`;
 if(new URLSearchParams(location.search).get('ui')==='classic')for(const link of host.querySelectorAll('a[href]'))link.setAttribute('href',navigationURL(link.getAttribute('href')));
 host.onkeydown=e=>{if(e.key==='Escape'){const d=host.querySelector('.nav-dropdown');if(d?.open){d.open=false;d.querySelector('summary').focus();e.preventDefault();}}};
}
document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown'))document.querySelector('.nav-dropdown')?.removeAttribute('open');});
