import {LANDING_DEFAULTS,STAGING_DEFAULTS,landingSimulation,stagingSimulation,idealIgnitionHeight} from './landing-staging-physics.mjs';
import {attachProcessUI} from './landing-staging-ui.js';
let serial=0;
const fmt=(v,n=1)=>Number(v).toFixed(n),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const range=(key,label,value,min,max,step,unit)=>`<label class="ls-control"><span>${label}<output data-value="${key}">${fmt(value,step<1?1:0)} ${unit}</output></span><input type="range" data-param="${key}" aria-label="${label}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
const landingCopy=`<p>先看关机滑落：高度下降，垂直速度更负，推进剂不变。点火后向上推力减慢下降，推进剂开始减少；质量越来越小，同样推力产生的加速度也越来越大。青色竖线是此刻，淡线是后续预测。可以拖动时间逐帧查看。</p><p>过早点火会在空中停止下降，随后重新上升。临界点火让速度为零的时刻恰好碰到地面；稍晚便带着剩余下降速度触地。这里“低速触地”只表示本一维模型的触地速率不超过2 m/s，未验证真实落地结构或姿态。</p><div class="ls-formula">dh/dt = v　 dv/dt = T/m − g<br>dm/dt = −T/(Isp·g₀)</div><p>h为距地面高度（m），v向上为正（m/s），T为向上推力（N），m为剩余总质量（kg），Isp为比冲（s）。g固定取9.80665 m/s²；比冲换算中的g₀始终为标准重力9.80665 m/s²。推进剂包含燃料与氧化剂；耗尽后推力为零。固定推力在理想点火时瞬间建立，触地时关机，忽略气动阻力、节流、姿态与发动机启动延迟。临界预设由当前条件下的运动方程求得。</p>`;
const stagingCopy=`<p>两枚火箭从相同的质量和速度出发，装着相同推进剂，使用相同比冲与流率。一级点火时两条曲线完全重合。一级耗尽后，一枚丢弃它的空贮箱与发动机，另一枚继续携带。分离瞬间只有质量下降，速度没有跳变。</p><p>二级点火时，丢掉空一级的火箭要推动的质量更小，所以同一份推进剂提供更多速度增量。实线为丢弃，虚线为携带；箭体的色带表示各级剩余推进剂。分离后的空一级保持分离时速度，上级继续加速，间距才逐渐增加。</p><div class="ls-formula">每级 Δv = Isp·g₀·ln(m₀/mf)<br>总理想 Δv = Δv₁ + Δv₂</div><p>m₀、mf是该段点火开始与结束时仍连在一起的总质量，包括结构、载荷与剩余推进剂。干质量指空贮箱、发动机与结构。曲线的时间由各级推进剂除以流率计算，一级和二级的预算分别累计。这里忽略引力、阻力和分离推力，以初始速度为零只计算理想速度增量，不能把总Δv当成实际入轨速度。箭体尺寸、相对间距与喷焰均为示意；质量和Δv曲线按方程计算。</p>`;

// Full ownership of host contents; no window global, shared scene, or shared CSS mutations.
export function mountLandingStaging(host,{mode='landing',onUpdate=()=>{}}={}){
 if(!host||!['landing','staging'].includes(mode))throw new TypeError('Expected host and landing/staging mode');
 const id=`ls${++serial}`,abort=new AbortController();let destroyed=false,raf=0,last=0,time=0,playing=false,speed=1,model,graphs=[],sceneMax=300;
 let landing={...LANDING_DEFAULTS,ignitionHeight:idealIgnitionHeight()},staging={...STAGING_DEFAULTS},chosen='critical',announced='';
 if(!document.querySelector('link[data-landing-staging-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./landing-staging-lab.css',import.meta.url).href;link.dataset.landingStagingStyle='';document.head.append(link);}
 const root=document.createElement('section');root.className='ls-lab';root.dataset.mode=mode;root.setAttribute('aria-label',mode==='landing'?'着陆点火时机实验':'分级质量与速度预算实验');host.replaceChildren(root);
 const $=s=>root.querySelector(s);
 const presentation=attachProcessUI(root);
 function graph(key,title,unit,domain,series){
  const gid=`${id}-${key}`,W=400,H=78,left=36,right=10,top=8,bottom=19,pw=W-left-right,ph=H-top-bottom;
  const x=t=>left+t/model.seconds*pw,y=v=>top+(domain[1]-v)/(domain[1]-domain[0])*ph;
  const path=points=>points.map((p,i)=>`${i?'L':'M'}${x(p[0]).toFixed(2)},${y(p[1]).toFixed(2)}`).join(' ');
  const grid=[domain[0],(domain[0]+domain[1])/2,domain[1]].map(v=>`<line class="ls-gridline" x1="${left}" x2="${W-right}" y1="${y(v)}" y2="${y(v)}"/>`).join('');
  const zero=domain[0]<0&&domain[1]>0?`<line class="ls-zero" x1="${left}" x2="${W-right}" y1="${y(0)}" y2="${y(0)}"/>`:'';
  const curves=series.map(s=>`<path class="ls-future" d="${path(s.points)}" stroke="${s.color}" ${s.dashed?'stroke-dasharray="5 3"':''}/><path clip-path="url(#${gid}-clip)" class="ls-history" d="${path(s.points)}" stroke="${s.color}" ${s.dashed?'stroke-dasharray="5 3"':''}/><circle data-dot="${s.key}" r="3.2" fill="${s.color}"/>`).join('');
  graphs.push({key,x,y,series});
  return `<div class="ls-chart" data-chart="${key}"><div class="ls-chart-label"><span>${title} <small>${unit}</small></span><output data-readout="${key}"></output></div><div class="ls-graph-drawing"><div class="ls-ylabels">${[domain[1],(domain[0]+domain[1])/2,domain[0]].map(v=>`<span>${fmt(v,Math.abs(v)<1&&v!==0?1:0)}</span>`).join('')}</div><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${title}随时间变化曲线，${unit}"><defs><clipPath id="${gid}-clip"><rect data-clip x="${left}" y="0" width="0" height="${H}"/></clipPath></defs>${grid}${zero}${model.events.map(e=>`<line class="ls-eventline" x1="${x(e.t)}" x2="${x(e.t)}" y1="${top}" y2="${H-bottom}"/>`).join('')}${curves}<line data-cursor class="ls-cursor" y1="${top}" y2="${H-bottom}"/></svg><div class="ls-xlabels"><span>0 s</span><span>${fmt(model.seconds,1)} s</span></div></div></div>`;
 }
 function landingScene(){return `<svg class="ls-landing-scene" viewBox="0 0 100 308" role="img" aria-label="火箭下降动画，高度标尺、速度箭头与发动机状态"><defs><marker id="${id}-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--al-series-green)"/></marker></defs>${[0,sceneMax/3,sceneMax*2/3,sceneMax].map(h=>`<line x1="28" x2="94" y1="${276-h/sceneMax*225}" y2="${276-h/sceneMax*225}" stroke="var(--al-line)"/><text x="24" y="${280-h/sceneMax*225}" text-anchor="end">${fmt(h,0)}</text>`).join('')}<text x="5" y="24">高度/m</text><line data-ignition-line x1="28" x2="94" stroke="var(--al-series-warm)" stroke-dasharray="4 3"/><text data-ignition-label x="92" text-anchor="end" fill="var(--al-series-warm)">点火</text><path d="M8 278 H96 V292 H8 Z" fill="#738677"/><path d="M40 274 H76 V279 H40 Z" fill="#283e34"/><g data-lander><path data-flame d="M51 2 L58 27 L65 2" fill="#ce894a"/><path d="M49 -24 L58 -34 L67 -24 V0 H49 Z" fill="#fbfaf4" stroke="#365b4d" stroke-width="1.6"/><rect x="52" y="-26" width="12" height="20" fill="#9cae96"/><rect data-tank x="52" y="-26" width="12" height="20" fill="#447767"/><path d="M51 -5 L43 7 M65 -5 L73 7" fill="none" stroke="#365b4d" stroke-width="1.6"/><line data-speed-arrow x1="83" x2="83" stroke="var(--al-series-green)" stroke-width="1.6" marker-end="url(#${id}-arrow)"/></g><text x="66" y="24" fill="var(--al-series-green)">v ↑</text><text data-scene-phase x="50" y="305" text-anchor="middle"></text></svg>`;}
 function stagingScene(){
  const compact=root.clientWidth<600,w=compact?.55:1,W=compact?120:280;
  const rocket=(prefix,x,carry)=>`<g transform="translate(${x} 0)"><text x="0" y="19" text-anchor="middle">${carry?'携带空级':'丢弃空级'}</text><g data-upper="${prefix}"><path d="M${-14*w} 45 L0 25 L${14*w} 45 V129 H${-14*w} Z" fill="#fbfaf4" stroke="${carry?'#a6663e':'#346d60'}" stroke-width="1.6"/><rect x="${-9*w}" y="51" width="${18*w}" height="60" fill="#e5e5d9"/><rect data-fuel2="${prefix}" x="${-9*w}" y="51" width="${18*w}" height="60" fill="${carry?'#b47b52':'#447767'}"/><text class="ls-rocket-label" x="0" y="123" text-anchor="middle">二级</text><path data-flame2="${prefix}" d="M${-8*w} 132 L0 155 L${8*w} 132" fill="#ce894a"/></g><g data-lower="${prefix}"><rect x="${-19*w}" y="130" width="${38*w}" height="106" fill="#fbfaf4" stroke="${carry?'#a6663e':'#346d60'}" stroke-width="1.6"/><rect x="${-13*w}" y="138" width="${26*w}" height="72" fill="#e5e5d9"/><rect data-fuel1="${prefix}" x="${-13*w}" y="138" width="${26*w}" height="72" fill="${carry?'#b47b52':'#447767'}"/><text class="ls-rocket-label" x="0" y="225" text-anchor="middle">一级</text><path data-flame1="${prefix}" d="M${-10*w} 239 L0 269 L${10*w} 239" fill="#ce894a"/></g></g>`;
  return `<svg class="ls-staging-scene" data-compact="${compact}" viewBox="0 0 ${W} 290" role="img" aria-label="相同初始火箭丢弃与携带空一级并列，色带表示剩余推进剂">${rocket('drop',compact?30:72,false)}${rocket('carry',compact?90:209,true)}<text x="${W/2}" y="284" text-anchor="middle" class="ls-svg-note">结构与间距为示意</text></svg>`;
 }
 function build(preserveControls=false){
  presentation.beforeBuild(preserveControls);
  pause();time=0;graphs=[];announced='';root.dataset.mode=mode;
  model=mode==='landing'?landingSimulation(landing):stagingSimulation(staging);
  if(mode==='landing')sceneMax=Math.max(300,Math.ceil(Math.max(...model.points.map(p=>p.h))/100)*100);
  const landingMode=mode==='landing',pts=model.points;
  const chartHTML=landingMode?
   graph('height','距地面高度','m',[0,Math.max(320,...pts.map(p=>p.h))*1.04],[{key:'height',points:pts.map(p=>[p.t,p.h]),color:'var(--al-series-green)'}])+
   graph('velocity','垂直速度','m/s',[Math.min(-45,...pts.map(p=>p.v))*1.08,Math.max(10,...pts.map(p=>p.v))*1.08],[{key:'velocity',points:pts.map(p=>[p.t,p.v]),color:'var(--al-series-warm)'}])+
   graph('fuel','剩余推进剂','kg',[0,landing.fuel*1.06],[{key:'fuel',points:pts.map(p=>[p.t,p.fuel]),color:'var(--al-series-blue)'}]):
   graph('dv','累计理想 Δv','km/s',[0,model.total*1.08],[{key:'drop',points:pts.map(p=>[p.t,p.dropped.dv]),color:'var(--al-series-green)'},{key:'carry',points:pts.map(p=>[p.t,p.carried.dv]),color:'var(--al-series-warm)',dashed:true}])+
   graph('mass','仍连在一起的质量','t',[0,model.initial*1.08],[{key:'drop',points:pts.map(p=>[p.t,p.dropped.mass]),color:'var(--al-series-green)'},{key:'carry',points:pts.map(p=>[p.t,p.carried.mass]),color:'var(--al-series-warm)',dashed:true}]);
  const mainControls=landingMode?range('ignitionHeight','降至此高度点火',landing.ignitionHeight,0,300,.1,'m'):range('payload','相同有效载荷',staging.payload,.5,10,.5,'t');
  const advanced=landingMode?range('thrust','固定推力',landing.thrust/1000,10,55,1,'kN')+range('fuel','初始推进剂',landing.fuel,30,400,10,'kg')+range('fallSpeed','初始下降速率',-landing.velocity,20,70,1,'m/s')+`<p>初始高度300 m · 干质量1800 kg · 比冲280 s。所有参数为教学假设，改变参数后时间与曲线回到起点。</p>`:range('isp','两级相同比冲',staging.isp,200,450,5,'s')+range('dry1','一级空结构质量',staging.dry1,2,20,.5,'t')+`<p>一级推进剂80 t，流率0.5 t/s；二级推进剂25 t，干质量3 t，流率0.15 t/s。相同初始质量、推进剂与比冲；所有数值为教学假设。</p>`;
  const markup=`<header class="ls-heading"><h2>${landingMode?'什么时候点火，才在地面减到零？':'丢掉空一级，什么时候开始有收益？'}</h2><p>${landingMode?'比较同一枚火箭的三次下降。向上为正；速度为零时，还要看它离地多高。':'两条相同初始火箭同步燃烧。分离改变质量，后续点火才改变速度。'}</p></header>${landingMode?'<div class="ls-presets" aria-label="点火时机预设"><button data-action="early">过早</button><button data-action="critical">临界</button><button data-action="late">过晚</button></div>':'<p class="ls-series-key"><span class="ls-solid">实线：丢弃空一级</span><span class="ls-dashed">虚线：携带空一级</span></p>'}<div class="ls-process"><div class="ls-scene">${landingMode?landingScene():stagingScene()}</div><div class="ls-charts">${chartHTML}${landingMode?'':`<div class="ls-budget"><span>一级 / 二级 Δv <small>km/s</small></span><output data-budget></output><div data-budget-bars></div></div>`}</div></div><p class="ls-now" data-now></p><div class="ls-transport"><button data-action="play" aria-pressed="false">播放</button><button data-action="reset">重置</button><label>播放速度<select data-speed aria-label="播放速度">${(landingMode?[.5,1,2]:[5,10,20]).map(v=>`<option value="${v}" ${v===(landingMode?1:10)?'selected':''}>${v}×</option>`).join('')}</select></label><output data-time></output></div><label class="ls-scrubber"><span>拖动时间查看过程</span><input data-time-input type="range" min="0" max="${model.seconds}" step=".001" value="0" aria-label="经过时间" aria-valuetext="0秒"></label><div class="ls-timeline" aria-label="事件时间线">${model.events.map(e=>`<button data-event="${e.t}"><span>${e.label}</span><small>${fmt(e.t,1)} s</small></button>`).join('')}</div><div class="ls-main-control">${mainControls}</div><p class="ls-result" data-result role="status" aria-live="polite"></p><details class="ls-details"><summary>推进参数与模型条件</summary>${advanced}</details><details class="ls-details ls-explanation"><summary>为什么会这样 · 公式与来源</summary>${landingMode?landingCopy:stagingCopy}<p>方程依据：<a href="https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/specific-impulse/" target="_blank" rel="noopener">NASA Glenn 比冲</a>、<a href="https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/" target="_blank" rel="noopener">理想火箭方程</a>。参数与过程为原创教学演算。<a href="/sources/landing-staging-sources.md">本模块计算方法与验证范围</a></p></details>`;
  if(preserveControls){
   const temp=document.createElement('div');temp.innerHTML=markup;
   for(const selector of ['.ls-process','.ls-timeline'])$(selector).replaceWith(temp.querySelector(selector));
   $('[data-time-input]').max=model.seconds;
   for(const input of root.querySelectorAll('[data-param]')){const k=input.dataset.param,value=landingMode?({...landing,thrust:landing.thrust/1000,fallSpeed:-landing.velocity})[k]:staging[k];input.value=value;
    $(`[data-value="${k}"]`).textContent=`${fmt(value,Number(input.step)<1?1:0)} ${k==='thrust'?'kN':k==='fallSpeed'?'m/s':k==='fuel'?'kg':k==='ignitionHeight'?'m':k==='isp'?'s':'t'}`;
   }
  }else{root.innerHTML=markup;speed=landingMode?1:10;}
  if(landingMode){for(const b of root.querySelectorAll('.ls-presets button')){b.setAttribute('aria-pressed',String(b.dataset.action===chosen));if(b.dataset.action==='critical')b.disabled=model.critical===null;}
   const iy=276-model.ignitionHeight/sceneMax*225; $('[data-ignition-line]').setAttribute('y1',iy);$('[data-ignition-line]').setAttribute('y2',iy);$('[data-ignition-label]').setAttribute('y',iy+4);
  }else{const max=model.total;$('[data-budget-bars]').innerHTML=['drop','carry'].map(key=>`<div class="ls-budget-row"><small>${key==='drop'?'丢弃':'携带'}</small><div><i data-bar="${key}-first" style="--width:0%;--color:var(--al-series-blue)"></i><i data-bar="${key}-second" style="--width:0%;--color:${key==='drop'?'var(--al-series-green)':'var(--al-series-warm)'}"></i></div><output data-budget-total="${key}"></output></div>`).join('');}
  presentation.sync(mode);
  update();
 }
 function update(){
  if(destroyed)return;
  const q=model.at(time),land=mode==='landing',end=time>=model.seconds-1e-9;
  for(const g of graphs){const node=$(`[data-chart="${g.key}"]`),xx=g.x(time);node.querySelector('[data-clip]').setAttribute('width',Math.max(0,xx-36));const cursor=node.querySelector('[data-cursor]');cursor.setAttribute('x1',xx);cursor.setAttribute('x2',xx);
   for(const s of g.series){const value=land?({height:q.h,velocity:q.v,fuel:q.fuel})[g.key]:g.key==='dv'?(s.key==='drop'?q.dropped.dv:q.carried.dv):(s.key==='drop'?q.dropped.mass:q.carried.mass);const dot=node.querySelector(`[data-dot="${s.key}"]`);dot.setAttribute('cx',xx);dot.setAttribute('cy',g.y(value));}
  }
  if(land){
   $('[data-readout="height"]').textContent=fmt(q.h,1);$('[data-readout="velocity"]').textContent=`${q.v>0?'+':''}${fmt(q.v,1)}`;$('[data-readout="fuel"]').textContent=fmt(q.fuel,1);
   const y=269-clamp(q.h,0,sceneMax)/sceneMax*225;$('[data-lander]').setAttribute('transform',`translate(0 ${y})`);$('[data-flame]').style.display=q.thrust>0?'':'none';const tank=$('[data-tank]'),fh=20*q.fuel/landing.fuel;tank.setAttribute('y',-6-fh);tank.setAttribute('height',fh);
   const arrow=$('[data-speed-arrow]');arrow.style.display=Math.abs(q.v)<.05?'none':'';arrow.setAttribute('y1',-20);arrow.setAttribute('y2',-20-clamp(q.v*.55,-38,38));
   const phase={coast:'关机滑落',braking:'点火减速',ascent:'持续点火 · 上升',empty:'燃尽 · 自由运动',contact:Math.abs(q.v)<=2?'低速触地':'带速触地'}[q.phase];$('[data-scene-phase]').textContent={coast:'关机滑落',braking:'点火减速',ascent:'转为上升',empty:'推进剂耗尽',contact:'已触地'}[q.phase];
   $('[data-now]').textContent=`${phase} · 推力 ${fmt(q.thrust/1000,0)} kN · 净加速度 ${q.acceleration>0?'+':''}${fmt(q.acceleration,1)} m/s²`;
   const result=end?(model.contact?`触地前垂直速度 ${fmt(model.contact.v,2)} m/s，剩余推进剂 ${fmt(q.fuel,1)} kg。${Math.abs(model.contact.v)<=2?'本模型中低速触地；接触后关机。':model.events.some(e=>e.type==='ignition')?'点火后仍未充分减速。':'触地发生在点火前；尚未消耗推进剂。'}`:model.kind==='early'?`在离地 ${fmt(model.turn.h,1)} m 处停止下降${q.v>1e-7?'，随后重新上升':'；尚未触地'}。实际观察零速后 ${fmt(model.observationAfterTurn,3)} s${model.endReason==='burnout'?'，在推进剂耗尽时结束观察':'，观察时段结束'}；尚未着陆。`:'观察时段结束，未触地。'):q.phase==='ascent'?'已经停止下降，但仍在地面上方；持续点火使它上升。':q.phase==='empty'?'推进剂耗尽，推力归零；已有速度和重力继续决定运动。':'先预测结果，再播放或拖动时间；三条曲线共用同一时钟。';
   if(result!==announced){$('[data-result]').textContent=result;announced=result;}
  }else{
   $('[data-readout="dv"]').textContent=`${fmt(q.dropped.dv,2)} / ${fmt(q.carried.dv,2)}`;$('[data-readout="mass"]').textContent=`${fmt(q.dropped.mass,1)} / ${fmt(q.carried.mass,1)}`;
   for(const key of ['drop','carry']){for(const [stage,fuel,initial,height,bottom]of [[1,q.fuel1,staging.prop1,72,210],[2,q.fuel2,staging.prop2,60,111]]){const tank=$(`[data-fuel${stage}="${key}"]`),h=height*fuel/initial;tank.setAttribute('height',h);tank.setAttribute('y',bottom-h);$(`[data-flame${stage}="${key}"]`).style.display=q.phase===(stage===1?'first':'second')?'':'none';}}
   // Camera follows upper stack. Gap starts at zero, grows with integrated relative motion.
   const gap=q.separated?Math.min(22,q.gap*.06):0;$('[data-lower="drop"]').setAttribute('transform',`translate(0 ${gap})`);$('[data-lower="drop"]').style.opacity=q.separated?'.55':'1';
   $('[data-now]').textContent=`${q.phase==='first'?'一级燃烧，两条曲线重合':q.phase==='second'?'二级燃烧，丢空级后质量更小':'两级燃烧结束'} · 已喷出 ${fmt(q.expelled,1)} t`;
   $('[data-budget]').textContent=`${fmt(q.dropped.dv1,2)} / ${fmt(q.dropped.dv2,2)}（丢弃）`;
   for(const key of ['drop','carry']){const s=key==='drop'?q.dropped:q.carried;$(`[data-bar="${key}-first"]`).style.setProperty('--width',`${s.dv1/model.total*100}%`);$(`[data-bar="${key}-second"]`).style.setProperty('--width',`${s.dv2/model.total*100}%`);$(`[data-budget-total="${key}"]`).textContent=fmt(s.dv,2);}
   const text=q.separated?`${end?'预算完成。':''}分离去掉 ${fmt(staging.dry1,1)} t 空结构，分离瞬间 Δv 不变。二级当前增加 ${fmt(q.dropped.dv2,2)} / ${fmt(q.carried.dv2,2)} km/s，收益 +${fmt(q.dropped.dv-q.carried.dv,2)} km/s。`: '一级结束前，两种策略的质量与 Δv 完全相同。选择时间线的“一级耗尽”查看分离瞬间。';if(text!==announced){$('[data-result]').textContent=text;announced=text;}
  }
  $('[data-time]').textContent=`${fmt(time,1)} / ${fmt(model.seconds,1)} s`;$('[data-time-input]').value=time;$('[data-time-input]').setAttribute('aria-valuetext',`${fmt(time,1)}秒`);
  $('[data-action="play"]').textContent=playing?'暂停':end?'重播':'播放';$('[data-action="play"]').setAttribute('aria-pressed',String(playing));$('[data-result]').setAttribute('aria-live',playing?'off':'polite');
  for(const b of root.querySelectorAll('[data-event]'))b.classList.toggle('ls-passed',Number(b.dataset.event)<=time+1e-8);
  onUpdate(snapshot());
 }
 function snapshot(){return {mode,time,playing,speed,model,current:model.at(time),destroyed};}
 function tick(stamp){if(!playing||destroyed)return;const dt=last?Math.min(.1,(stamp-last)/1000):0;last=stamp;time=Math.min(model.seconds,time+dt*speed);if(time>=model.seconds){playing=false;last=0;raf=0;}update();if(playing)raf=requestAnimationFrame(tick);}
 function play(){if(destroyed||playing)return;if(time>=model.seconds)time=0;playing=true;last=0;update();raf=requestAnimationFrame(tick);}
 function pause(){playing=false;last=0;if(raf)cancelAnimationFrame(raf);raf=0;}
 function seek(t){pause();time=clamp(t,0,model.seconds);update();}
 function reset(){if(destroyed)return;if(mode==='landing'){landing={...LANDING_DEFAULTS,ignitionHeight:idealIgnitionHeight()};chosen='critical';}else staging={...STAGING_DEFAULTS};build();$('[data-action="reset"]').focus({preventScroll:true});}
 function preset(key){const critical=idealIgnitionHeight(landing);if(critical===null&&key==='critical')return;landing.ignitionHeight=key==='early'?Math.min(300,(critical??220)+75):key==='late'?Math.max(0,(critical??200)-75):critical;chosen=key;build();$(`[data-action="${key}"]`).focus({preventScroll:true});}
 root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!root.contains(b))return;if(b.dataset.event!==undefined){seek(Number(b.dataset.event));return;}if(b.dataset.action==='play'){if(playing){pause();update();}else play();}else if(b.dataset.action==='reset')reset();else if(['early','critical','late'].includes(b.dataset.action))preset(b.dataset.action);},{signal:abort.signal});
 root.addEventListener('input',e=>{const input=e.target;if(input.matches('[data-time-input]')){seek(Number(input.value));return;}if(!input.dataset.param)return;const key=input.dataset.param,value=Number(input.value);pause();
  // Preserve DOM/focus while dragging parameters; rebuilding only the drawing avoids lost pointer capture.
  if(mode==='landing'){if(key==='thrust')landing.thrust=value*1000;else if(key==='fallSpeed')landing.velocity=-value;else landing[key]=value;chosen=key==='ignitionHeight'?'custom':chosen;if(key!=='ignitionHeight'&&chosen==='critical')landing.ignitionHeight=idealIgnitionHeight(landing)??landing.ignitionHeight;}else staging[key]=value;
  build(true);
 },{signal:abort.signal});
 root.addEventListener('change',e=>{if(e.target.matches('[data-speed]'))speed=Number(e.target.value);},{signal:abort.signal});
 root.addEventListener('keydown',e=>{if(e.key==='End'&&e.target.matches('[data-time-input]')){e.preventDefault();seek(model.seconds);}},{signal:abort.signal});
 const visibility=()=>{if(document.hidden&&playing){pause();update();}};document.addEventListener('visibilitychange',visibility,{signal:abort.signal});
 build();
 const resize=new ResizeObserver(()=>{if(destroyed||mode!=='staging')return;const compact=root.clientWidth<600;if($('[data-compact]')?.dataset.compact!==String(compact)){ $('.ls-scene').innerHTML=stagingScene();update();}});resize.observe(root);
 return {destroy(){if(destroyed)return;pause();destroyed=true;abort.abort();resize.disconnect();presentation.dispose();if(root.parentNode===host)root.remove();},setMode(next){if(!['landing','staging'].includes(next))throw new RangeError('Unknown mode');if(destroyed)return;mode=next;root.setAttribute('aria-label',mode==='landing'?'着陆点火时机实验':'分级质量与速度预算实验');build();},seek,play,pause(){pause();update();},reset,get snapshot(){return snapshot();}};
}
