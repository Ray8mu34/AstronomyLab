const disclosure=(label,node,className='')=>{const d=document.createElement('details'),s=document.createElement('summary');d.className=className;s.textContent=label;d.append(s,node);return d;};
const moveDisclosure=(node,label,className)=>{if(!node)return null;const slot=document.createComment('editorial disclosure');node.before(slot);const d=disclosure(label,node,className);slot.replaceWith(d);return d;};

function learningGuide(node,question,instruction){
 if(!node)return;
 node.classList.add('experiment-start');node.setAttribute('data-learning-guide','');
 question?.setAttribute('data-learning-question','');instruction?.setAttribute('data-learning-instruction','');
}

// Reorganize existing interface nodes. Rendering, physical state and event handlers
// stay with the original modules; details keep optional material within reach.
export function editorialLab(app){
 const slug=location.pathname.split('/').pop(),host=app.querySelector('#lab-mount');host.classList.add('editorial-lab');host.dataset.lab=slug;
 app.querySelector('.page-lead')?.remove();
 const guides={sky:'.sky-guide',optics:'.optics-guide',light:'.light-question',stars:'.stars-question',galaxy:'.galaxy-head',orbits:'.orbits-guide',measure:'.measure-guide',alignments:'.alignment-guide'};
 const guide=host.querySelector(guides[slug]);
 let alignmentGuideObserver=null;
 if(guide){
  // Keep the original, mode-bound nodes near the drawing. Short instructions
  // are part of starting an experiment; full explanations stay in their details.
  const hint=guide.querySelector('[data-hint]'),shortDetails=hint?.closest('details');
  if(shortDetails){shortDetails.before(hint);shortDetails.remove();}
  guide.querySelector('[data-action="guide"]')?.setAttribute('hidden','');
  if(slug==='alignments'){
   const start=document.createElement('header');guide.before(start);start.append(guide);
   const copy=host.querySelector('#alignment-copy');
   const update=()=>{const question=copy.querySelector(':scope > h2');if(!question)return;start.querySelector('[data-learning-question]')?.remove();start.prepend(question);learningGuide(start,question,guide);};
   update();alignmentGuideObserver=new MutationObserver(update);alignmentGuideObserver.observe(copy,{childList:true});
  }else learningGuide(guide,guide.querySelector('h2'),guide.querySelector('[data-hint],[data-instruction],#sky-instruction,#orbit-instruction,#measure-instruction,#galaxy-guide'));
  if(slug==='orbits')host.querySelector('.lab-tabs').after(guide);
 }
 // The stellar introduction gives context, while the question below gives the
 // first action. Keep the longer context accessible without duplicating it.
 if(slug==='stars'){
  const background=moveDisclosure(host.querySelector('.stars-start'),'恒星实验的背景','experiment-explanation');
  host.querySelector('.stars-explanation')?.before(background);
 }
 let modeGuideObserver=null;
 if(slug==='orbits'){
  const mark=()=>{const node=host.querySelector('.ls-heading');if(node&&!node.hasAttribute('data-learning-guide'))learningGuide(node,node.querySelector('h2'),node.querySelector('p'));};
  mark();modeGuideObserver=new MutationObserver(mark);
  modeGuideObserver.observe(host.querySelector('#orbit-landing-staging-slot'),{childList:true,subtree:true});
 }
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
 return ()=>{observer?.disconnect();modeGuideObserver?.disconnect();alignmentGuideObserver?.disconnect();if(galaxyPresetClick)host.removeEventListener('click',galaxyPresetClick);};
}

export function editorialLegacy(){
 document.body.classList.add(location.pathname.includes('solar-system')?'editorial-solar':'editorial-moon');
 const ready=()=>{
  if(document.body.classList.contains('editorial-solar')){
   const brand=document.querySelector('.topbar>.brand');if(brand)brand.remove();
   const sceneHeading=document.querySelector('.scene-heading');if(sceneHeading)sceneHeading.hidden=true;
   const h=document.createElement('h1');h.className='legacy-title';h.textContent='太阳系';document.querySelector('.topbar').before(h);
   document.querySelector('.planet-rail').before(document.querySelector('.workspace'));
   const hint=document.querySelector('#observation-hint'),prompt=document.querySelector('.experiment-prompt');hint.hidden=false;learningGuide(prompt,prompt.querySelector('strong'),hint);document.querySelector('#hint-toggle').hidden=true;
   const sources=document.querySelector('.topbar>.text-button');sources.textContent='资料 ↗';sources.setAttribute('aria-label','资料与图注');
   document.querySelector('#reset-experiment').textContent='重置';
   document.querySelector('.experiment-prompt').classList.add('legacy-prompt');
  }else{
   document.querySelector('.lab-header').hidden=true;
   const intro=document.querySelector('.intro');intro.querySelector('h1').textContent='日地月的运动与所见';intro.querySelector('.intro-note').remove();intro.querySelector('.eyebrow').textContent='第03—04讲';
   const guide=document.querySelector('.experiment-guide');learningGuide(guide,guide.querySelector('#guide-question'),guide.querySelector('#guide-operation'));
   document.querySelectorAll('.experiments button>small,.experiments button>span').forEach(n=>n.remove());
   document.querySelector('.observation-link').classList.add('legacy-observation');
  }
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
}
