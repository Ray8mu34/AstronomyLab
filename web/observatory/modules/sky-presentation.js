import {applyPresentation,bindDisclosures} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';

// Presentation consumes the existing controls and scene references. The six
// modes, physical state, time progression and restoration remain in sky.js.
export function attachSkyPresentation(root,{state,redraw}){
 const q=selector=>root.querySelector(selector),pilot=q('.sky-atlas'),sceneHost=q('#sky-scene'),points=new Map();
 const names={sky:'太阳路径',stars:'方向与距离',measure:'测影',calendar:'历法',day:'两种一天',precession:'地轴岁差'};
 let current=null,disposed=false,labels=null,pending=false,epoch=0,scene=null,instructionSlot=null;
 function restoreInstruction(){if(instructionSlot){instructionSlot.replaceWith(q('#sky-instruction'));instructionSlot=null;}q('#sky-instruction').hidden=q('[data-action=guide]').getAttribute('aria-expanded')!=='true';q('[data-action=guide]').hidden=false;q('#sky-legend').hidden=false;}
 const modeOf=value=>value.tab==='measure'&&value.measureTask==='calendar'?'calendar':value.tab;
 const disposePresentation=applyPresentation(pilot,{surface:modeOf(state)==='calendar'?'paper':'scene',redraw});
 const disposeNavigation=mountWorkspaceNavigation(pilot,{modeNav:q('.sky-mode-menu'),source:q('.sky-reading a'),label:'天球与时间导航'});
 const disposeDisclosures=bindDisclosures(pilot);
 function resetLabels(){epoch++;pending=false;for(const item of points.values())item.sprite.visible=item.visible;points.clear();for(const layer of labels||[])layer.dispose();labels=null;}
 const compact=()=>true;
 function specifications(kind){
  if(!compact()||!scene)return[];
  const sky=current==='sky',view=state.view;
  const names=sky?(kind==='directions'?(view==='earth'?[]:[['北','left','lower'],['南','right','lower'],['西','left','bottom'],['东','right','bottom']]):view==='earth'?[['北天极','left','top'],['太阳','right','top'],['当地铅直','left','upper'],['观察者','left','lower']]:[['北天极','left','top'],['太阳','right','top'],['天顶','left','upper']]):current==='measure'?[...[...points.keys()].filter(x=>x.startsWith('竖表')).map(x=>[x,'left','top']),['太阳方向','right','top'],['影端','left','upper'],['影长超出画面','left','upper']]:[];
  return names.flatMap(([text,side,row])=>{const item=points.get(text);if(!item?.sprite.parent)return[];const point=item.sprite.getWorldPosition(item.sprite.position.clone()),p=point.clone().project(scene.camera);if(p.z< -1||p.z>1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1)return[];return[{key:'sky-'+text,text,color:item.color,point,side,row}];});
 }
 function drawLabels(){
  if(disposed||!scene||!['sky','measure'].includes(current))return;
  scene.camera.updateMatrixWorld(true);for(const [text,item]of points)if(!item.sprite.parent)points.delete(text);
  const shown=[...specifications('celestial'),...(current==='sky'?specifications('directions'):[])].map(x=>x.text);
  for(const [text,item]of points)item.sprite.visible=shown.includes(text)?false:item.visible;
  if(labels){for(const layer of labels)compact()?layer.update():layer.hide();return;}
  if(!compact()||pending)return;pending=true;const generation=epoch;
  import('./sky-motion-labels.js').then(({makeMotionLabels})=>{if(disposed||generation!==epoch)return;labels=[makeMotionLabels(sceneHost,scene.camera,()=>specifications('celestial'))];if(current==='sky')labels.push(makeMotionLabels(sceneHost,scene.camera,()=>specifications('directions')));drawLabels();}).finally(()=>{if(generation===epoch)pending=false;});
 }
 function setMode(value){
  const next=modeOf(value);if(next===current)return;resetLabels();restoreInstruction();current=next;
  if(next==='calendar'){const instruction=q('#sky-instruction');instructionSlot=document.createComment('calendar instruction return');instruction.before(instructionSlot);q('.sky-explanation').append(instruction);instruction.hidden=false;q('[data-action=guide]').hidden=true;q('#sky-legend').hidden=true;}
  if(next==='stars')q('#sky-plot').dataset.alThemeFixed='dark';else delete q('#sky-plot').dataset.alThemeFixed;
  const surface=next==='calendar'?'paper':'scene';pilot.dataset.alSurface=surface;root.dataset.alSurface=surface;
  const url=new URL(location.href);url.searchParams.set('mode',next);globalThis.AstronomyLabPresentationRoutes?.apply(url.href);
  q('.sky-mode-menu>summary').textContent=names[next]+' ⌄';
  if(next==='stars')q('#sky-chart').open=true;
  else q('#sky-chart').open=false;
 }
 function render(value){
  setMode(value);
  const identity=q('#sky-identity'),inside=current==='sky'&&value.view==='inside';identity.hidden=current!=='stars'&&!inside;if(current==='stars'){const star=window.__lab.catalogue.stars.find(item=>item.hip===Number(value.selected));identity.textContent=`${star.label} · Hipparcos / ICRS 1991.25`;}else if(inside)identity.textContent=`方位 ${value.look}°（北 0°，东 90°） · 仰角 ${value.lookAltitude}° · 垂直视场 100°`;
  for(const button of pilot.querySelectorAll('button:not(.sky-tabs button)'))button.classList.add('al-button');
  q('[data-action=play]').classList.remove('al-button');q('[data-action=play]').classList.add('al-action');
  for(const details of pilot.querySelectorAll('details'))details.classList.add('al-disclosure');
  const owner=window.__lab?.scene;if(owner!==scene){scene?.controls.removeEventListener('change',drawLabels);scene=owner;scene?.controls.addEventListener('change',drawLabels);}drawLabels();
 }
 const click=event=>{if(event.target.closest('[data-navigation-mode]')){const menu=q('.sky-mode-menu');menu.open=false;if(event.isTrusted)menu.querySelector('summary').focus({preventScroll:true});}};
 const toggle=event=>{if(event.target===q('#sky-chart')&&event.target.open)redraw();};
 const observer=new ResizeObserver(drawLabels);observer.observe(sceneHost);pilot.addEventListener('click',click);pilot.addEventListener('toggle',toggle,true);setMode(state);
 return{setMode,render,label(sprite,text,color){if(['sky','measure'].includes(current))points.set(text,{sprite,text,color:color||'#cbd5dd',visible:sprite.visible});},dispose(){disposed=true;restoreInstruction();resetLabels();observer.disconnect();scene?.controls.removeEventListener('change',drawLabels);pilot.removeEventListener('click',click);pilot.removeEventListener('toggle',toggle,true);disposeDisclosures();disposeNavigation();disposePresentation();}};
}
