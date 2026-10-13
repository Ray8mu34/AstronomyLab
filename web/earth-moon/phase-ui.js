// Approved B-reduced presentation for phase only. The model and its public API
// remain owned by app.js; this adapter moves the original controls, never copies them.
import * as THREE from 'three';
import {decodeRecipe} from './scene-state.js';

export function installPhaseUI(lab) {
 if (!lab?.state.ready) return;
 const $=id=>document.getElementById(id),body=document.body;
 const ui=document.createElement('div');ui.id='phase-ui';ui.hidden=true;
 ui.innerHTML=`<header class="reduced-header"><a class="reduced-brand" href="/">AstronomyLab <span>/ 日地月</span></a><button id="mode-entry" popovertarget="mode-menu">月相 <span aria-hidden="true">⌄</span></button><button id="condition-entry" popovertarget="condition-menu">条件 <span aria-hidden="true">＋</span></button></header>
 <section id="mode-menu" class="overlay mode-menu" popover="auto" aria-label="选择模式"></section>
 <section id="phase-menu" class="overlay phase-menu" popover="auto" aria-label="月相预设"><p class="overlay-label">跳到月相</p></section>
 <section id="condition-menu" class="overlay condition-menu" popover="manual" aria-label="参数与条件"><div class="overlay-heading"><strong>条件与观察</strong><button class="close-control" popovertarget="condition-menu" popovertargetaction="hide" aria-label="关闭条件">×</button></div></section>
 <div class="subject-caption"><span class="caption-label">地心方向所见</span><button id="phase-entry" popovertarget="phase-menu"><span id="reduced-phase"></span><span class="small-chevron" aria-hidden="true">⌄</span></button><span class="caption-label">固定黄道北向上 · 月面按视场放大</span></div>
 <p class="reduced-boundary">普通月相不是地球影子。</p><div class="reduced-transport" aria-label="时间控制"></div>`;
 body.append(ui);
 const modes=document.querySelector('.experiments'),controls=document.querySelector('.controls'),geometry=$('geometry-settings'),metrics=document.querySelector('.metrics'),speed=document.querySelector('.speed-label'),viewTools=document.querySelector('.view-tools'),viewSwitch=document.querySelector('.view-switch'),heading=document.querySelector('.space-view .view-title'),headingText=heading.querySelector('span'),timeLabel=document.querySelector('.time-label'),status=$('status');
 const guide=document.querySelector('.experiment-guide'),boundary=$('mode-boundary'),interpretation=document.querySelector('.interpretation');
 const originals={heading:headingText.innerHTML,time:timeLabel.firstChild.textContent,dayDescription:$('day').getAttribute('aria-describedby'),resetTitle:$('reset').getAttribute('title'),geometryOpen:geometry.open};
 const homes=new Map();
 for(const el of [modes,$('guide-actions'),controls,metrics,speed,viewTools,viewSwitch,$('presentation'),$('plane-note'),$('scene-caption'),$('sources'),$('play'),timeLabel,$('reset'),$('day'),status,guide,boundary]){const marker=document.createComment('phase-ui original position');el.before(marker);homes.set(el,marker);}
 const viewSettings=document.createElement('details');viewSettings.className='view-settings';viewSettings.innerHTML='<summary>播放与显示</summary>';
 const compare=document.createElement('button');compare.id='compare-entry';compare.setAttribute('aria-pressed','false');compare.textContent='展开比较 ↗';
 const rate=document.createElement('span');rate.className='time-rate';
 const hint=document.createElement('span');hint.className='clock-hint';hint.innerHTML='<span>−1天</span><span class="clock-basis" id="clock-basis"></span><span>60天</span>';
 const hidden=[document.querySelector('header.lab-header'),document.querySelector('.workspace-bar'),$('site-navigation'),document.querySelector('.observer-view>.view-title'),document.querySelector('.observer-caption'),...document.querySelectorAll('#preset-summary,.controls>.fineprint')].filter(el=>el!==boundary);
 const labelStyles=new Map(['earth-label','moon-label'].map(id=>[$(id),$(id).getAttribute('style')]));
 const reference=document.createElementNS('http://www.w3.org/2000/svg','svg');reference.classList.add('solar-reference');reference.setAttribute('aria-label','指向太阳的方向参照；边缘标志不表示太阳距离');reference.setAttribute('role','img');reference.innerHTML='<line id="solar-ray" stroke-dasharray="4 5"/><path id="solar-arrow"/><circle id="solar-dot" r="4"/><text id="solar-word">太阳方向</text>';reference.hidden=true;$('space').append(reference);
 const solar=lab.scene.children.find(node=>node.isGroup&&node.children.some(child=>child.isMesh&&child.material?.color?.getHex()===0xf9cc6e)),sunMesh=solar?.children.find(child=>child.isMesh),point=new THREE.Vector3();
 let active=false,comparing=false,frame=0,suspended=false;
 function closeMenus(){for(const el of ui.querySelectorAll('[popover]'))if(el.matches(':popover-open'))el.hidePopover();}
 function clockSemantics(){
  if(!active)return;
  rate.textContent='播放速率 '+$('speed').selectedOptions[0].textContent;
  let origin='本次载入起点';
  try{const entry=history.state?.astronomy?.entryId,saved=JSON.parse(sessionStorage.getItem('astronomy:moon-scene:v1:'+entry));if(saved?.origin)origin='载入起点 '+decodeRecipe(saved.origin).days.toFixed(3)+' 天';}catch{/* Unavailable storage must leave real controls usable. */}
  $('clock-basis').textContent='0天为模型基准，非日历日期 · 复位回'+origin+'并暂停';$('reset').title='返回'+origin+'（包括载入条件与视角）并暂停';
 }
 function sync(){
  const phase=lab.state.mode==='phase';
  if(phase!==active){
   active=phase;ui.hidden=!active;body.classList.toggle('reduced',active);body.classList.toggle('comparing',active&&comparing);
   if(active){
    $('mode-menu').append(modes);$('phase-menu').append($('guide-actions'));$('condition-menu').append(metrics,controls);
    viewSettings.append(speed,viewTools,viewSwitch,$('presentation'),$('plane-note'),$('scene-caption'));controls.append(viewSettings,$('sources'));$('explanation').before(guide);interpretation.append(boundary);
    headingText.innerHTML='空间关系 <small>· 拖动月球</small>';heading.append(compare);
    ui.querySelector('.reduced-transport').append($('play'),timeLabel,$('reset'),$('day'),hint,status);
    timeLabel.firstChild.textContent='模型第 ';timeLabel.append(rate);$('day').setAttribute('aria-describedby','clock-basis');status.classList.add('phase-status');
    for(const el of hidden)el.classList.add('legacy-hidden');
   }else{
    closeMenus();for(const [el,marker]of homes)marker.after(el);
    viewSettings.remove();compare.remove();rate.remove();hint.remove();headingText.innerHTML=originals.heading;timeLabel.firstChild.textContent=originals.time;status.classList.remove('phase-status');
    for(const el of hidden)el.classList.remove('legacy-hidden');
    for(const [el,value]of labelStyles)value===null?el.removeAttribute('style'):el.setAttribute('style',value);
    for(const [el,key,attr]of [[$('day'),'dayDescription','aria-describedby'],[$('reset'),'resetTitle','title']])originals[key]===null?el.removeAttribute(attr):el.setAttribute(attr,originals[key]);
    geometry.open=originals.geometryOpen;
   }
   lab.resize();
  }
  reference.style.display=active?'':'none';
  if(active){geometry.open=true;$('reduced-phase').textContent=$('phase-name').textContent;compare.hidden=lab.state.view!=='paired';clockSemantics();}
 }
 compare.addEventListener('click',()=>{if(!active||!lab.state.ready)return;comparing=!comparing;body.classList.toggle('comparing',comparing);compare.textContent=comparing?'收起比较 ↙':'展开比较 ↗';compare.setAttribute('aria-pressed',String(comparing));lab.resize();});
 document.addEventListener('keydown',e=>{if(active&&e.key==='Escape'&&$('condition-menu').matches(':popover-open')&&!document.querySelector('dialog[open]')){e.preventDefault();$('condition-menu').hidePopover();$('condition-entry').focus();}});
 for(const id of ['mode-entry','phase-entry'])$(id).addEventListener('click',()=>{if($('condition-menu').matches(':popover-open'))$('condition-menu').hidePopover();});
 modes.addEventListener('click',e=>{if(e.target.closest('[data-mode]'))closeMenus();});
 $('guide-actions').addEventListener('click',e=>{if(e.target.closest('button')&&$('phase-menu').matches(':popover-open'))$('phase-menu').hidePopover();});
 for(const menu of ui.querySelectorAll('[popover]')){const trigger=ui.querySelector(`[popovertarget="${menu.id}"]`);trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',menu.id);menu.addEventListener('toggle',e=>{trigger.setAttribute('aria-expanded',String(e.newState==='open'));if(e.newState==='open')menu.scrollTop=0;});}
 $('speed').addEventListener('change',clockSemantics);
 const modeObserver=new MutationObserver(sync);modeObserver.observe(body,{attributes:true,attributeFilter:['data-experiment-mode','data-stage-view']});
 const mirror=new MutationObserver(()=>{if(active){$('reduced-phase').textContent=$('phase-name').textContent;clockSemantics();}});for(const el of [$('phase-name'),$('day-value'),status])mirror.observe(el,{childList:true,characterData:true,subtree:true});
 const geometryDisplay=new MutationObserver(()=>{if(active&&!geometry.open)geometry.open=true;});geometryDisplay.observe(geometry,{attributes:true,attributeFilter:['open']});
 function projected(position,w,h){const p=position.clone().project(lab.camera);return {x:(p.x+1)*w/2,y:(1-p.y)*h/2,z:p.z};}
 function scientificLabels(){
  if(!active||!lab.state.ready||!sunMesh)return;
  const w=$('space').clientWidth,h=$('space').clientHeight;if(!w||!h)return;
  const earth=projected(new THREE.Vector3(),w,h),moon=projected(lab.moon.position,w,h),sun=projected(sunMesh.getWorldPosition(point),w,h);
  const dx=sun.x-earth.x,dy=sun.y-earth.y,border=24;
  const scale=Math.min(1,dx>0?(w-border-earth.x)/dx:dx<0?(border-earth.x)/dx:1,dy>0?(h-border-earth.y)/dy:dy<0?(border-earth.y)/dy:1);
  const anchor={x:earth.x+dx*Math.max(0,scale),y:earth.y+dy*Math.max(0,scale)},direction=Math.atan2(dy,dx),tip={x:anchor.x-Math.cos(direction)*12,y:anchor.y-Math.sin(direction)*12};
  const ray=$('solar-ray');ray.setAttribute('x1',earth.x);ray.setAttribute('y1',earth.y);ray.setAttribute('x2',tip.x);ray.setAttribute('y2',tip.y);
  $('solar-dot').setAttribute('cx',anchor.x);$('solar-dot').setAttribute('cy',anchor.y);
  const back={x:tip.x-Math.cos(direction)*8,y:tip.y-Math.sin(direction)*8};$('solar-arrow').setAttribute('d',`M${back.x+Math.sin(direction)*4},${back.y-Math.cos(direction)*4} L${tip.x},${tip.y} L${back.x-Math.sin(direction)*4},${back.y+Math.cos(direction)*4}`);
  let sx=Math.max(12,Math.min(w-112,anchor.x-40)),sy=Math.max(22,Math.min(h-10,anchor.y+(anchor.y>h/2?-17:25)));
  const place=(id,p,other)=>{
   const el=$(id),width=el.offsetWidth||42,height=el.offsetHeight||26;let x=Math.max(width/2+10,Math.min(w-width/2-10,p.x)),y=p.y-32;
   if(y<12)y=p.y+24;if(Math.abs(x-other.x)<width+16&&Math.abs(y-other.y)<38)y=p.y+28;
   if(Math.abs(x-(sx+45))<width/2+55&&Math.abs(y-sy)<30)y=p.y+28;y=Math.max(14,Math.min(h-height-8,y));
   el.hidden=p.z>1||p.z< -1||p.x<0||p.x>w||p.y<0||p.y>h;el.style.left=x+'px';el.style.top=y+'px';return {x,y};
  };
  const earthLabel=place('earth-label',earth,moon),moonLabel=place('moon-label',moon,earthLabel);
  if(Math.abs(moonLabel.x-(sx+45))<80&&Math.abs(moonLabel.y-sy)<30)sy=Math.max(22,Math.min(h-10,sy+(sy>h/2?-36:36)));
  $('solar-word').setAttribute('x',sx);$('solar-word').setAttribute('y',sy);
 }
 function presentationFrame(){if(suspended||!lab.state.ready||!lab.renderer.domElement.isConnected){frame=0;return;}scientificLabels();frame=requestAnimationFrame(presentationFrame);}
 window.addEventListener('pagehide',e=>{suspended=true;cancelAnimationFrame(frame);frame=0;if(!e.persisted){modeObserver.disconnect();mirror.disconnect();geometryDisplay.disconnect();}});
 window.addEventListener('pageshow',e=>{if(e.persisted&&lab.state.ready){suspended=false;sync();if(!frame)frame=requestAnimationFrame(presentationFrame);}});
 sync();frame=requestAnimationFrame(presentationFrame);
}
