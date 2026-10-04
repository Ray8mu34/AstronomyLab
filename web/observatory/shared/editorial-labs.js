const disclosure=(label,node,className='')=>{const d=document.createElement('details'),s=document.createElement('summary');d.className=className;s.textContent=label;d.append(s,node);return d;};
const moveDisclosure=(node,label,className)=>{if(!node)return null;const slot=document.createComment('editorial disclosure');node.before(slot);const d=disclosure(label,node,className);slot.replaceWith(d);return d;};

// Reorganize existing interface nodes. Rendering, physical state and event handlers
// stay with the original modules; details keep optional material within reach.
export function editorialLab(app){
 const slug=location.pathname.split('/').pop(),host=app.querySelector('#lab-mount');host.classList.add('editorial-lab');host.dataset.lab=slug;
 app.querySelector('.page-lead')?.remove();
 const guides={sky:'.sky-guide',optics:'.optics-guide',light:'.light-question',stars:'.stars-question',galaxy:'.galaxy-head',orbits:'.orbits-guide',measure:'.measure-guide',alignments:'.alignment-guide'};
 const guide=host.querySelector(guides[slug]);
 if(guide){const d=disclosure('观察说明',guide,'experiment-guide');const anchor=host.querySelector('[class$="-explanation"],.alignment-reading-details,.orbits-analysis,.measure-analysis,.galaxy-more');if(anchor)anchor.before(d);else host.append(d);guide.querySelector('[data-action="guide"]')?.setAttribute('hidden','');guide.querySelectorAll('details').forEach(x=>x.open=true);}
 const layouts=['.sky-workspace','.optics-workspace','.light-workbench','.stars-workbench','.orbits-workspace','.measure-workspace'];for(const selector of layouts)host.querySelector(selector)?.classList.add('experiment-layout');
 host.querySelectorAll('.sky-controls,.optics-controls,.light-controls,.stars-controls,.orbits-desk,.measure-desk,.alignment-primary-controls').forEach(x=>x.classList.add('experiment-controls'));
 host.querySelectorAll('.lab-tabs,.sky-tabs,.optics-tasks,.galaxy-topics').forEach(x=>x.classList.add('experiment-modes'));
 const focusButton=host.querySelector('.stars-focus-button,.light-focus-button');if(focusButton){const bar=document.createElement('div');bar.className='experiment-focus';bar.append(focusButton);host.querySelector('.experiment-modes').after(bar);}
 host.querySelectorAll('.stars-focus-bar,.light-focus-bar').forEach(x=>{if(!x.children.length)x.remove();});
 host.querySelectorAll('.stars-links,.light-links,.sky-reading').forEach(x=>x.remove());
 if(['orbits','measure'].includes(slug)){
  const copy=host.querySelector(slug==='orbits'?'#orbit-copy':'#measure-copy');moveDisclosure(copy,'解释与公式','experiment-explanation');
  const extra=host.querySelector(`.${slug}-pilot > .lab-copy`);moveDisclosure(extra,'观测图版与相关资料','experiment-explanation');
 }
 let galaxyPresetClick=null;
 if(slug==='galaxy'){
  const panel=host.querySelector('.galaxy-scene-panel'),feedback=host.querySelector('#galaxy-feedback');
  panel.prepend(host.querySelector('#galaxy-view-buttons'));panel.append(feedback);feedback.textContent='';
  host.querySelector('#galaxy-scene').after(host.querySelector('#galaxy-overlay'));
  galaxyPresetClick=e=>{if(innerWidth<701&&e.target.closest('#galaxy-view-buttons button')&&panel.getBoundingClientRect().bottom>innerHeight)panel.scrollIntoView({block:'start'});};
  host.addEventListener('click',galaxyPresetClick);
 }
 const observer=slug==='sky'?new MutationObserver(()=>{
  const day=host.querySelector('.sky-pilot').dataset.mode==='day',controls=host.querySelector('.sky-controls');
  let slot=host.querySelector('.day-controls');if(!slot){slot=document.createElement('div');slot.className='day-controls';host.querySelector('.sky-stage').before(slot);}
  const input=controls.querySelector('[data-key="dayHours"]');if(day&&input){slot.replaceChildren();slot.append(input.closest('.control'));const endpoints=controls.querySelector('.sky-endpoints');if(endpoints)slot.append(endpoints);}
  if(!day&&slot.children.length)slot.replaceChildren();slot.hidden=!day;
 }):null;
 if(observer){observer.observe(host.querySelector('.sky-controls'),{childList:true});host.querySelector('.sky-controls').append(document.createComment('layout'));}
 return ()=>{observer?.disconnect();if(galaxyPresetClick)host.removeEventListener('click',galaxyPresetClick);};
}

export function editorialLegacy(){
 document.body.classList.add(location.pathname.includes('solar-system')?'editorial-solar':'editorial-moon');
 const ready=()=>{
  if(document.body.classList.contains('editorial-solar')){
   const brand=document.querySelector('.topbar>.brand');if(brand)brand.remove();
   const sceneHeading=document.querySelector('.scene-heading');if(sceneHeading)sceneHeading.hidden=true;
   const h=document.createElement('h1');h.className='legacy-title';h.textContent='太阳系';document.querySelector('.topbar').before(h);
   document.querySelector('.planet-rail').before(document.querySelector('.workspace'));
   const hint=document.querySelector('#observation-hint');const slot=document.createComment('hint');hint.before(slot);const guide=disclosure('观察说明',hint,'legacy-guide');slot.replaceWith(guide);const question=document.querySelector('.experiment-prompt>strong');if(question)guide.querySelector('summary').after(question);document.querySelector('#hint-toggle').hidden=true;
   const sources=document.querySelector('.topbar>.text-button');sources.textContent='资料 ↗';sources.setAttribute('aria-label','资料与图注');
   document.querySelector('#reset-experiment').textContent='重置';
   document.querySelector('.experiment-prompt').classList.add('legacy-prompt');
  }else{
   document.querySelector('.lab-header').hidden=true;
   const intro=document.querySelector('.intro');intro.querySelector('h1').textContent='日地月的运动与所见';intro.querySelector('.intro-note').remove();intro.querySelector('.eyebrow').textContent='第03—04讲';
   const guide=document.querySelector('.experiment-guide');moveDisclosure(guide,'观察说明','legacy-guide');
   document.querySelectorAll('.experiments button>small,.experiments button>span').forEach(n=>n.remove());
   document.querySelector('.observation-link').classList.add('legacy-observation');
  }
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
}
