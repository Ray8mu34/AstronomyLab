// Eclipse presentation only. Original native DOM, physical results and recipes
// remain owned by app.js. A displayed view never replaces the observer identity.
import * as THREE from 'three';
import {decodeRecipe} from './scene-state.js';
export function installEclipseUI(lab){
 if(!lab?.state.ready)return;
 const $=id=>document.getElementById(id),body=document.body,ui=document.createElement('section');ui.id='eclipse-ui';ui.hidden=true;
 ui.innerHTML=`<header class="eclipse-header"><a href="/">AstronomyLab <small>/ 日地月</small></a><details id="eclipse-modes"><summary>日月食 ⌄</summary></details><details id="eclipse-presets"><summary>载入预设 ⌄</summary></details><button id="eclipse-condition-entry" aria-expanded="false" aria-controls="eclipse-information">条件与解释 ＋</button></header><div class="eclipse-clock" aria-label="模型运动控制"></div><p id="eclipse-clock-basis"></p><details id="eclipse-information"><summary>条件与解释</summary><div class="eclipse-info-heading"><strong>改变对齐条件，观察遮挡与入影</strong><button id="eclipse-close">关闭 ×</button></div><div class="eclipse-info-body"></div></details>`;
 body.append(ui);
 const modes=document.querySelector('.experiments'),guide=$('guide-actions'),controls=document.querySelector('.controls'),spaceView=document.querySelector('.space-view'),observerView=document.querySelector('.observer-view'),shadow=$('shadow-panel'),metrics=document.querySelector('.metrics'),time=document.querySelector('.time-label'),speed=document.querySelector('.speed-label'),spaceTitle=spaceView.querySelector('.view-title>span'),observerTitle=observerView.querySelector('.view-title'),info=ui.querySelector('.eclipse-info-body'),homes=new Map();
 const display=document.createElement('details');display.id='eclipse-display';display.innerHTML='<summary>显示比例与空间视角</summary>';
 const reading=document.createElement('details');reading.innerHTML='<summary>原理与公式</summary>';
 const extras=document.createElement('details');extras.id='eclipse-extras';extras.innerHTML='<summary>完整读数、显示与资料</summary>';
 const parameter=document.createElement('label');parameter.className='eclipse-parameter-choice';parameter.innerHTML='调整条件 <select id="eclipse-parameter"><option value="inclination">月轨倾角</option><option value="distance">地月距离</option><option value="node">交点线方向</option><option value="east">观察点东偏</option><option value="north">观察点北偏</option></select>';
 const parameterFields=['inclination','distance','node','east','north'].map(id=>({id,el:$(id).closest('label')}));
 const shadowScroll=document.createElement('div');shadowScroll.className='eclipse-shadow-scroll';
 const caption=document.querySelector('.observer-caption'),context=document.createElement('p');context.className='eclipse-observer-context';
 const fieldNote=document.createElement('p');fieldNote.className='eclipse-field-note';fieldNote.hidden=true;
 const geometryContext=document.createElement('p');geometryContext.className='eclipse-geometry-context';
 const meaning=document.createElement('p');meaning.className='eclipse-meaning';meaning.textContent='天体与影锥按展示比例缩放；遮挡率按物理尺寸计算。';
 const sectionEntry=document.createElement('button');sectionEntry.id='eclipse-section-entry';sectionEntry.textContent='解释本影 / 半影 / 伪本影 ↗';sectionEntry.setAttribute('aria-pressed','false');
 const sectionClose=document.createElement('button');sectionClose.id='eclipse-section-close';sectionClose.textContent='收起影锥 ×';
 const solarRef=document.createElementNS('http://www.w3.org/2000/svg','svg');solarRef.classList.add('eclipse-solar-reference');solarRef.setAttribute('role','img');solarRef.setAttribute('aria-label','太阳方向；边缘标志不表示太阳距离');solarRef.innerHTML='<line/><path/><text>太阳方向</text>';
 const hidden=[document.querySelector('.lab-header'),$('site-navigation'),document.querySelector('.workspace-bar'),controls,$('playback'),spaceView.querySelector('.view-title'),$('plane-note')];
 const labels=['earth-label','moon-label','sun-label','observer-label'].map(id=>$(id));
 const originalLabels=labels.map(el=>({el,style:el.getAttribute('style'),text:el.innerHTML}));
 const viewNames=[...document.querySelectorAll('[data-view]')].map(el=>({el,text:el.textContent}));
 let active=false,frame=0,suspended=false,originalTime,originalObservedAria,originalLocalAria,originalResetTitle;
 function move(el,to){if(!homes.has(el)){const marker=document.createComment('eclipse original position');el.before(marker);homes.set(el,marker);}if(el.parentElement!==to)to.append(el);}
 function suspend(){if(!active)return;active=false;for(const d of ui.querySelectorAll('details'))d.open=false;ui.hidden=true;body.classList.remove('eclipse-observing','eclipse-conditions','eclipse-with-shadow');$('eclipse-information').open=false;ui.append($('eclipse-information'),ui.querySelector('.eclipse-clock')||document.querySelector('.eclipse-clock'),$('eclipse-clock-basis'));for(const field of parameterFields)field.el.classList.remove('eclipse-field-inactive');hidden.forEach(el=>el.classList.remove('eclipse-legacy-hidden'));for(const[el,marker]of homes){marker.after(el);marker.remove();}homes.clear();for(const el of[context,fieldNote,geometryContext,meaning,sectionEntry,sectionClose,solarRef,display,reading,extras,parameter,shadowScroll])el.remove();for(const {el,style,text}of originalLabels){style===null?el.removeAttribute('style'):el.setAttribute('style',style);el.innerHTML=text;}for(const {el,text}of viewNames)el.textContent=text;time.firstChild.textContent=originalTime;for(const[el,old,attr]of[[$('observed'),originalObservedAria,'aria-label'],[$('eclipse-time'),originalLocalAria,'aria-describedby'],[$('reset'),originalResetTitle,'title']])old===null?el.removeAttribute(attr):el.setAttribute(attr,old);lab.resize();}
 function current(){if(!active)return;
  $('geometry-settings').open=true;
  body.classList.toggle('eclipse-conditions',$('eclipse-information').open);
  body.classList.toggle('eclipse-with-shadow',lab.state.view==='shadow');
  if(lab.state.observe!=='sun'&&['east','north'].includes($('eclipse-parameter').value))$('eclipse-parameter').value='inclination';
  for(const option of $('eclipse-parameter').options)option.disabled=lab.state.observe!=='sun'&&['east','north'].includes(option.value);
  for(const field of parameterFields)field.el.classList.toggle('eclipse-field-inactive',field.id!==$('eclipse-parameter').value);
  // Presentation of restored legacy view IDs: result + necessary geometry stay
  // available; shadow is an optional explanation, never an exclusive viewport.
  spaceView.hidden=false;observerView.hidden=false;shadow.hidden=lab.state.view!=='shadow';
  sectionEntry.setAttribute('aria-pressed',String(!shadow.hidden));sectionEntry.textContent=shadow.hidden?'解释本影 / 半影 / 伪本影 ↗':'收起影锥 ×';
  const solar=lab.state.observe==='sun';context.textContent=solar?`观察太阳 · 从随月下点移动的教学地面点看 · 东偏 ${lab.state.east.toFixed(1)}° / 北偏 ${lab.state.north.toFixed(1)}°（非城市）`:'观察月球 · 沿原地心方向看月面 · 固定黄道北向上';
  meaning.textContent=(!solar&&lab.state.red?'月食红光示意 · ':'')+'天体与影锥按展示比例缩放；遮挡率按物理尺寸计算。';
  $('observed').setAttribute('aria-label',context.textContent+'；空格播放或暂停');
  geometryContext.textContent=solar?'金点：教学地面观察点 · 跟随月下点；拖动月球看对齐变化':'月面采用地心方向；金点非月食观察者。拖动月球看入影变化';
  $('observer-label').style.display=solar?'':'none';
  const disk=lab.snapshot?.solar,w=$('solar-disc').clientWidth,h=$('solar-disc').clientHeight,r=Math.min(h*.32,w*.33);
  fieldNote.hidden=!solar||!disk||disk.horizon<=0||Math.abs(disk.x*r/disk.sunRadius)<w/2+disk.moonRadius*r/disk.sunRadius&&Math.abs(disk.y*r/disk.sunRadius)<h/2+disk.moonRadius*r/disk.sunRadius;
  if(!fieldNote.hidden)fieldNote.textContent=`月球圆面在视场外，角距 ${(disk.separation/lab.physics.RAD).toFixed(2)}°`;
  let origin='本次载入起点';try{const entry=history.state?.astronomy?.entryId,saved=JSON.parse(sessionStorage.getItem('astronomy:moon-scene:v1:'+entry));if(saved?.origin){const s=decodeRecipe(saved.origin),names={total:'日全食',annular:'日环食',partial:'日偏食',miss:'新月却无食',lunar:'月全食'};origin=(names[s.guidePreset]||'导入 / 模式')+'起点（'+s.days.toFixed(3)+' 天）';}}catch{/* Original storage fallback remains usable. */}
  const note=$('eclipse-clock-basis');note.textContent=`模型第 ${$('day-value').textContent} 天 · ${$('speed').selectedOptions[0].textContent} · 局部小时以模型新 / 满月为零点。${lab.state.guidePreset?'载入条件':'当前手调 / 播放'}；复位回${origin}并暂停。`;
  $('reset').title='返回'+origin+'与载入视角并暂停';
  $('status').classList.toggle('eclipse-error',/失败|不兼容/.test($('status').textContent));
 }
 function sync(){if(lab.state.mode!=='eclipse'){suspend();return;}if(active){current();lab.resize();return;}
  active=true;ui.hidden=false;body.classList.add('eclipse-observing');hidden.forEach(el=>el.classList.add('eclipse-legacy-hidden'));originalTime=time.firstChild.textContent;originalObservedAria=$('observed').getAttribute('aria-label');originalLocalAria=$('eclipse-time').getAttribute('aria-describedby');originalResetTitle=$('reset').getAttribute('title');
  move(modes,$('eclipse-modes'));move(guide,$('eclipse-presets'));move($('preset-summary'),$('eclipse-presets'));move($('observe-toggle'),observerTitle);observerTitle.after(context);move(caption,observerView);caption.prepend(fieldNote);observerView.append(meaning);spaceView.append(geometryContext,sectionEntry);$('space').append(solarRef);shadow.querySelector('.view-title').append(sectionClose);
  spaceView.append($('eclipse-information'));move(shadow,spaceView);info.append(parameter,extras);extras.append(display,reading);for(const el of[$('geometry-settings')])move(el,info);move($('eclipse-controls'),extras);$('geometry-settings').open=true;for(const el of[document.querySelector('.view-switch'),document.querySelector('.view-tools'),$('presentation')])move(el,display);move($('scene-caption'),spaceView);for(const el of[document.querySelector('.experiment-guide'),document.querySelector('.interpretation'),$('mode-boundary')])move(el,reading);move(document.querySelector('.recipe-controls'),extras);move(metrics,extras);move($('sources'),extras);move($('shadow-svg'),shadowScroll);shadow.querySelector('.shadow-heading').after(shadowScroll);
  for(const el of[$('play'),$('local-time'),$('reset'),time,$('status')])move(el,ui.querySelector('.eclipse-clock'));move(speed,display);time.firstChild.textContent='模型第 ';$('eclipse-time').setAttribute('aria-describedby','eclipse-clock-basis');
  for(const{el}of viewNames){if(el.dataset.view==='space')el.textContent='空间关系';if(el.dataset.view==='observer')el.textContent='观测结果';if(el.dataset.view==='shadow')el.textContent='展开影锥解释';if(el.dataset.view==='paired')el.textContent='观测与空间关系';}
  observerTitle.after(context);$('observed').before(document.querySelector('.eclipse-clock'),$('eclipse-clock-basis'));current();lab.resize();lab.refresh();
 }
 function closeInfo(){ $('eclipse-information').open=false;$('eclipse-condition-entry').focus({preventScroll:true});document.querySelector('.views').scrollIntoView({block:'start'}); }
 $('eclipse-condition-entry').onclick=()=>{$('eclipse-information').open=!$('eclipse-information').open;};$('eclipse-close').onclick=closeInfo;
 $('eclipse-information').addEventListener('toggle',()=>{$('eclipse-condition-entry').setAttribute('aria-expanded',String($('eclipse-information').open));if(active){current();lab.resize();lab.refresh();}});
 parameter.querySelector('select').onchange=()=>{current();};
 function section(open){const s=lab.getState();s.view=open?'shadow':'paired';lab.applyState(s);}
 sectionEntry.onclick=()=>section(shadow.hidden);sectionClose.onclick=()=>section(false);
 guide.addEventListener('click',e=>{if(e.target.closest('[data-guide-action]')){$('eclipse-presets').open=false;$('eclipse-presets').querySelector('summary').focus({preventScroll:true});}});modes.addEventListener('click',e=>{if(e.target.closest('[data-mode]'))$('eclipse-modes').open=false;});
 document.addEventListener('moon-ui-before-mode',e=>{if(e.detail.mode!=='eclipse')suspend();});
 const observer=new MutationObserver(sync);observer.observe(body,{attributes:true,attributeFilter:['data-experiment-mode','data-stage-view']});
 const mirror=new MutationObserver(current);for(const el of[$('day-value'),$('phase-name'),$('play'),$('status')])mirror.observe(el,{childList:true,characterData:true,subtree:true});$('speed').addEventListener('change',current);
 // Native handlers persist the loaded origin after their state transition.
 // Read it after that event completes, without becoming a second state owner.
 for(const type of['click','input','change'])document.addEventListener(type,()=>{if(active)queueMicrotask(current);});
 document.addEventListener('keydown',e=>{if(!active||e.key!=='Escape'||document.querySelector('dialog[open]'))return;const d=document.activeElement?.closest('details[open]');if(d&&(ui.contains(d)||$('eclipse-information').contains(d))){d.open=false;(d===$('eclipse-information')?$('eclipse-condition-entry'):d.querySelector('summary')).focus({preventScroll:true});e.preventDefault();}else if($('eclipse-information').open){closeInfo();e.preventDefault();}else if(!shadow.hidden){section(false);sectionEntry.focus();e.preventDefault();}});
 // Stable, clamped labels reference original rendered positions. Nothing here
 // changes the orbit, angular radii, shadow geometry, camera or observer.
 const solarGroup=lab.scene.children.find(n=>n.isGroup&&n.children.some(c=>c.isMesh&&c.material?.color?.getHex()===0xf9cc6e)),sun=solarGroup?.children.find(c=>c.isMesh),v=new THREE.Vector3();
 function labelsFrame(){if(!active||!lab.state.ready||!sun)return;const w=$('space').clientWidth,h=$('space').clientHeight;if(!w||!h)return;
  const project=p=>{const q=p.clone().project(lab.camera);return{x:(q.x+1)*w/2,y:(1-q.y)*h/2,z:q.z};},earth=project(new THREE.Vector3()),moon=project(lab.moon.position),solar=project(sun.getWorldPosition(v)),dx=solar.x-earth.x,dy=solar.y-earth.y,t=Math.max(0,Math.min(1,dx>0?(w-20-earth.x)/dx:dx<0?(20-earth.x)/dx:1,dy>0?(h-24-earth.y)/dy:dy<0?(24-earth.y)/dy:1)),end={x:earth.x+dx*t,y:earth.y+dy*t},a=Math.atan2(dy,dx);
  const ray=solarRef.querySelector('line');for(const[k,value]of Object.entries({x1:earth.x,y1:earth.y,x2:end.x,y2:end.y}))ray.setAttribute(k,value);solarRef.querySelector('path').setAttribute('d',`M${end.x-Math.cos(a)*10+Math.sin(a)*4},${end.y-Math.sin(a)*10-Math.cos(a)*4} L${end.x},${end.y} L${end.x-Math.cos(a)*10-Math.sin(a)*4},${end.y-Math.sin(a)*10+Math.cos(a)*4}`);
  const text=solarRef.querySelector('text');text.setAttribute('x',Math.max(6,Math.min(w-100,end.x-35)));text.setAttribute('y',end.y>h/2?Math.max(18,end.y-18):Math.min(h-10,end.y+28));$('sun-label').style.display='none';
  const taken=[{x:Number(text.getAttribute('x'))+45,y:Number(text.getAttribute('y'))-7,w:90}];for(const[id,p,base]of[['earth-label',earth,-31],['moon-label',moon,30]]){const el=$(id),ew=el.offsetWidth||80;let x=Math.max(ew/2+6,Math.min(w-ew/2-6,p.x)),y=Math.max(15,Math.min(h-15,p.y+base));for(const r of taken)if(Math.abs(x-r.x)<(ew+r.w)/2+6&&Math.abs(y-r.y)<28)y=Math.max(15,Math.min(h-15,y+35));el.style.left=x+'px';el.style.top=y+'px';el.hidden=p.z>1||p.z< -1||p.x<0||p.x>w||p.y<0||p.y>h;taken.push({x,y,w:ew});}
  const site=lab.scene.children.find(n=>n.isMesh&&n.geometry?.parameters?.radius===.055);if(site){const p=project(site.position),el=$('observer-label');el.textContent='地面观察点';el.style.left=Math.max(55,Math.min(w-55,p.x))+'px';el.style.top=Math.max(16,Math.min(h-16,p.y+31))+'px';el.hidden=p.z>1||Math.abs(p.x-w/2)>w/2||Math.abs(p.y-h/2)>h/2;}
 }
 function frameLoop(){if(suspended||!lab.state.ready||!lab.renderer.domElement.isConnected){frame=0;return;}labelsFrame();frame=requestAnimationFrame(frameLoop);}
 window.addEventListener('pagehide',e=>{suspended=true;cancelAnimationFrame(frame);if(!e.persisted){observer.disconnect();mirror.disconnect();}});window.addEventListener('pageshow',e=>{if(e.persisted&&lab.state.ready){suspended=false;sync();if(!frame)frame=requestAnimationFrame(frameLoop);}});sync();frame=requestAnimationFrame(frameLoop);
}
