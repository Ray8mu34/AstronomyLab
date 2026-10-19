import { EARTH } from './orbits-physics.mjs';
import { conicState, propagateConic, conicPoint, traceConic } from './orbit-conics-physics.mjs';
import {validateExperimentModel} from '../shared/experiment-state.js';
const TAU=2*Math.PI;
const n=(v,d=3)=>Number.isFinite(v)?v.toLocaleString('zh-CN',{maximumFractionDigits:d}):'无';
const hours=s=>n(s/3600,s<3600?3:2)+' h';
const range=(key,label,value,min,max,step)=>`<label class="conic-control"><span>${label}<output data-conic-value="${key}"></output></span><input type="range" aria-label="${label}" data-conic-key="${key}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
export function mountConics(slot){
 const initial=conicState(200,7.79),state={mode:'orbit',height:200,speed:initial.vc,totalHours:2,rateHours:.1,elapsed:0,progress:0,play:false,view:'whole'};
 const defaults={...state};let active=true,info,frame,last=0,lastPaint=0,result,background=[],viewport;
 slot.innerHTML=`<link rel="stylesheet" href="/modules/orbit-conics.css"><section class="conics-lab">
 <div class="conic-heading"><div><strong data-conic-kind></strong><span data-conic-class></span></div><div class="conic-views" aria-label="轨道视角"><button data-conic-view="whole">整体轨道</button><button data-conic-view="near">近地点</button></div></div>
 <div class="conic-workbench"><div class="conic-visual"><canvas class="conic-canvas" aria-label="地球位于焦点的解析轨道；虚线为完整轨道，亮线为已走轨迹"></canvas>
 <div class="conic-transport"><button data-conic-action="play" class="conic-play">▶ 播放</button><button data-conic-action="reset">↺ 重置</button><output data-conic-time></output></div>
 <label class="conic-timeline"><span>经过时间 <output data-conic-value="progress"></output></span><input type="range" min="0" max="1" step=".0001" value="0" data-conic-key="progress" aria-label="拖动经过时间"></label>
 <p class="conic-caption" data-conic-caption></p></div>
 <div class="conic-controls"><div class="conic-presets" aria-label="轨道预设"><button data-conic-preset="circle">圆</button><button data-conic-preset="ellipse">椭圆</button><button data-conic-preset="parabola">临界抛物线</button><button data-conic-preset="hyperbola">双曲线</button></div>
 ${range('speed','初始横向速度 · km/s',state.speed,0,16,.001)}<p class="conic-reference" data-conic-reference></p>
 <div class="conic-times"><label>总仿真时间 · h<input type="number" data-conic-key="totalHours" min=".01" max="876000" step="any" aria-label="总仿真时间（小时）" value="2"></label><label>每真实秒推进 · h<input type="number" data-conic-key="rateHours" min=".00001" max="1000000" step="any" aria-label="每真实秒推进的仿真小时" value=".1"></label></div>
 <div class="conic-shortcuts"><button data-conic-action="period">总时长设为一圈</button><button data-conic-action="end">到终点</button></div><p class="conic-status" role="status" data-conic-status></p>
 <details class="conic-parameters"><summary>释放高度与更多读数</summary>${range('height','释放高度 · km',200,100,5000,10)}<button data-conic-preset="drop">只抬高，横速为零</button><dl data-conic-numbers></dl></details></div></div>
 <details class="conic-explanation"><summary>怎样读轨道、时间与视窗</summary><p>虚线是由初始位置和速度确定的解析轨道，亮色实线是从释放时刻到现在实际走过的部分。负能量轨道是椭圆，圆是偏心率为零的椭圆特例；零能量是临界抛物线，正能量是双曲线。零横速退化为径向下落。轨迹若进入球形地球，飞行器在第一次触地时停止。</p><p>总仿真时间决定时间轴终点，每真实秒推进的小时数决定播放快慢。两者可以各自调整，也可以直接拖动时间。近逃逸椭圆的一圈可能长达数月；“总时长设为一圈”可以观察闭合，不必改变物理速度。重置回到圆轨道起点；改速度或高度会重新释放，切视角保持当前时间。</p><p>整体视角展示完整闭合椭圆；抛物线和双曲线只有有限视窗，箭头说明仍在延伸。近地点视角保留地球附近的形状，画面外的飞行器有方向提示。两视角均使用相同的横纵长度比例，地球是焦点，图中飞行器与微小焦点指示被放大。</p><p>这是固定球形地球、无大气、无其他天体扰动的理想二体模型。远至月球或更大的巨大椭圆仍是数学演示，不能据此预测真实地球卫星的长期轨道。轨道采用统一变量解析推进。</p><p><a href="/sources/orbit-conics.md">解析方法与来源</a></p></details></section>`;
 const canvas=slot.querySelector('canvas'),ctx=canvas.getContext('2d');
 const earthImage=new Image();earthImage.src='/textures/earth_daymap.jpg';earthImage.onload=()=>draw();
 const $=s=>slot.querySelector(s);
 function rebuild(){info=conicState(state.height,state.speed);state.elapsed=0;state.progress=0;state.play=false;state.view=info.e>.85?'near':'whole';geometry();update();draw();}
 function geometry(){
  const whole=state.view==='whole',r0=info.r;
  let xmin,xmax,ymax;
  background=[];
  if(whole&&info.alpha>0&&info.speed>0){
   for(let i=0;i<=1600;i++)background.push(conicPoint(info,i/1600*TAU));
   xmin=Math.min(...background.map(p=>p.x),-EARTH.radius);xmax=Math.max(...background.map(p=>p.x),EARTH.radius);ymax=Math.max(...background.map(p=>Math.abs(p.y)),EARTH.radius);
  }else if(info.speed===0){xmin=-1.6*r0;xmax=1.6*r0;ymax=1.2*r0;}
  else{
   const maxR=(whole?24:5)*r0,limit=Math.acos(Math.max(-1,Math.min(1,(info.p/maxR-1)/info.e)));
   if(info.e<1e-12){for(let i=0;i<=1200;i++)background.push(conicPoint(info,i/1200*TAU));}
   else for(let i=0;i<=1400;i++){const theta=-limit+2*limit*i/1400,r=info.p/(1+info.e*Math.cos(theta)),sign=info.q>=1?1:-1;background.push({x:sign*r*Math.cos(theta),y:sign*r*Math.sin(theta)});}
   if(whole){xmin=Math.min(...background.map(p=>p.x),-r0);xmax=Math.max(...background.map(p=>p.x),r0);ymax=Math.max(...background.map(p=>Math.abs(p.y)),r0);}
   else{xmin=-3*r0;xmax=2*r0;ymax=2.4*r0;}
  }
  viewport={xmin,xmax,ymax};
 }
 function update(){
  state.elapsed=Math.min(state.elapsed,state.totalHours*3600,info.impactTime);state.progress=state.elapsed/(state.totalHours*3600);
  result={info,point:propagateConic(info,state.elapsed),seconds:state.elapsed,impact:state.elapsed>=info.impactTime,totalSeconds:state.totalHours*3600};
  $('[data-conic-kind]').textContent=info.kind;
  const eText=info.energy!==0&&Math.abs(info.e-1)<1e-7?info.e.toPrecision(16):n(info.e,8);
  $('[data-conic-class]').textContent=`e = ${eText} · ε ${info.energy===0?'= 0':info.energy<0?'< 0':'> 0'}`;
  $('[data-conic-value="speed"]').textContent=n(state.speed,6);
  $('[data-conic-value="height"]').textContent=n(state.height,0);
  $('[data-conic-reference]').textContent=`圆速 ${n(info.vc,6)} / 逃逸 ${n(info.escape,6)} km/s`;
  $('[data-conic-value="progress"]').textContent=hours(state.elapsed)+' / '+hours(state.totalHours*3600);
  $('[data-conic-time]').textContent=`${hours(state.elapsed)}${result.impact?' · 已触地':state.elapsed>=state.totalHours*3600?' · 时间轴终点':''}`;
  $('[data-conic-action="play"]').textContent=state.play?'❚❚ 暂停':'▶ 播放';$('[data-conic-action="play"]').setAttribute('aria-pressed',String(state.play));
  for(const b of slot.querySelectorAll('[data-conic-view]'))b.setAttribute('aria-pressed',String(b.dataset.conicView===state.view));
  for(const input of slot.querySelectorAll('[data-conic-key]'))if(document.activeElement!==input){const key=input.dataset.conicKey;input.value=['totalHours','rateHours'].includes(key)?Number(state[key].toPrecision(8)):state[key];}
  const period=$('[data-conic-action="period"]');period.disabled=!Number.isFinite(info.period)||info.period/3600>876000||Number.isFinite(info.impactTime);period.title=Number.isFinite(info.impactTime)?'本轨迹先触地，不能完成一圈':!Number.isFinite(info.period)?'开放轨道没有有限周期':info.period/3600>876000?'周期超过100年教学时间范围':'';
  const energyText=info.energy===0?'0':Math.abs(info.energy)<1e-6?info.energy.toExponential(6):n(info.energy,9);
  const definitions=[['圆速 / 逃逸速度',`${n(info.vc,6)} / ${n(info.escape,6)} km/s`],['初始比机械能',`${energyText} MJ/kg`],['近地点高度',`${n(info.peri-EARTH.radius,1)} km`],['远地点高度',Number.isFinite(info.apo)?`${n(info.apo-EARTH.radius,1)} km`:'无有限远地点'],['周期',Number.isFinite(info.period)?hours(info.period):'无有限周期'],['当前位置高度',`${n(result.point.r-EARTH.radius,1)} km`],['当前速率',`${n(result.point.v,6)} km/s`]];
  $('[data-conic-numbers]').innerHTML=definitions.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('');
  const long=info.e>.85&&info.alpha>0;
  $('[data-conic-caption]').textContent=`虚线：解析轨道 · 金线：已走轨迹 · 金点：飞行器。${Number.isFinite(info.impactTime)?'止于首次触地。':info.alpha<=0?'箭头以外仍继续，轨道没有终点。':long?'巨大椭圆可切换整体视角看闭合。':'地球位于焦点，圆是椭圆特例。'}`;
  if(result.impact)$('[data-conic-status]').textContent=`${hours(info.impactTime)}首次触地；理想真空模型未计算更早的气动减速。`;
  else $('[data-conic-status]').textContent=`${Number.isFinite(info.period)?'一圈 '+hours(info.period):'开放轨道无周期'} · ${n(state.totalHours/state.rateHours,1)} s真实播放${info.e>.85&&info.alpha>0?'；远距二体演示忽略月球/太阳扰动':''}`;
 }
 function draw(){
  if(!info||!active||!canvas.clientWidth)return;
  const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(2,devicePixelRatio||1);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#08131e';ctx.fillRect(0,0,w,h);
  const v=viewport,pad=32,scale=Math.min((w-2*pad)/Math.max(v.xmax-v.xmin,EARTH.radius*2),(h-2*pad)/(v.ymax*2));
  const cx=w/2-(v.xmin+v.xmax)/2*scale,cy=h/2;
  const screen=p=>[cx+p.x*scale,cy-p.y*scale];
  function line(points,color,width=1,dash=[]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();points.forEach((p,i)=>{const [x,y]=screen(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.setLineDash([]);}
  function dot(p,r,color){const [x,y]=screen(p);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=color;ctx.fill();}
  function arrow(x,y,dx,dy,color){const l=Math.hypot(dx,dy);if(!l)return;dx/=l;dy/=l;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-dx*12-dy*5,y-dy*12+dx*5);ctx.lineTo(x,y);ctx.lineTo(x-dx*12+dy*5,y-dy*12-dx*5);ctx.stroke();}
  ctx.save();ctx.beginPath();ctx.rect(12,12,w-24,h-24);ctx.clip();
  ctx.strokeStyle='#152a3a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.stroke();
  if(background.length)line(background,'#719ba5',1.6,[5,5]);
  if(state.elapsed>0){
   let trail;
   if(info.alpha>0&&info.speed>0){
    const sign=info.q>=1?1:-1,b=Math.sqrt(info.a*info.p),start=info.q>=1?0:Math.PI;
    let end=Math.atan2(result.point.y/(sign*b),result.point.x/(sign*info.a)+info.e);end=(end-start+TAU)%TAU;
    if(state.elapsed>=info.period)end=TAU;
    trail=Array.from({length:1201},(_,i)=>conicPoint(info,start+end*i/1200));
   }else trail=traceConic(info,state.elapsed,500);
   line(trail,'#f5cd77',2.6);
  }
  const earthR=EARTH.radius*scale;
  if(earthR>=3){ctx.save();ctx.beginPath();ctx.arc(cx,cy,earthR,0,TAU);ctx.clip();ctx.fillStyle='#245374';ctx.fillRect(cx-earthR,cy-earthR,earthR*2,earthR*2);if(earthImage.complete&&earthImage.naturalWidth)ctx.drawImage(earthImage,cx-earthR,cy-earthR,2*earthR,2*earthR);const gradient=ctx.createLinearGradient(cx-earthR,cy-earthR,cx+earthR,cy+earthR);gradient.addColorStop(0,'#00000000');gradient.addColorStop(1,'#000000b0');ctx.fillStyle=gradient;ctx.fillRect(cx-earthR,cy-earthR,2*earthR,2*earthR);ctx.restore();ctx.strokeStyle='#6595a8';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,earthR,0,TAU);ctx.stroke();}
  else dot({x:0,y:0},3,'#6eacbf');
  const [sx,sy]=screen({x:info.r,y:0});ctx.strokeStyle='#f0f0e1';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(sx,sy,4,0,TAU);ctx.stroke();
  const [px,py]=screen(result.point);
  if(px>16&&px<w-16&&py>16&&py<h-16)dot(result.point,5,'#ffda8f');
  else{const dx=px-w/2,dy=py-h/2,k=Math.min((w/2-24)/Math.max(1,Math.abs(dx)),(h/2-24)/Math.max(1,Math.abs(dy)));arrow(w/2+dx*k,h/2+dy*k,dx,dy,'#ffda8f');}
  if(info.alpha<=0||state.view==='near'&&info.e>.1){
   const inside=([x,y])=>x>=16&&x<=w-16&&y>=16&&y<=h-16;
   for(let i=0;i<background.length-1;i++){
    const a=screen(background[i]),b=screen(background[i+1]);
    if(inside(a)!==inside(b)){const inner=inside(a)?a:b,outer=inside(a)?b:a,dx=outer[0]-inner[0],dy=outer[1]-inner[1];
     const k=Math.min(dx===0?Infinity:((dx>0?w-16:16)-inner[0])/dx,dy===0?Infinity:((dy>0?h-16:16)-inner[1])/dy);
     arrow(inner[0]+dx*k,inner[1]+dy*k,dx,dy,'#87b8bd');
    }
   }
   for(const idx of [0,background.length-1]){const p=background[idx],next=background[idx===0?1:idx-1];if(p&&next){const a=screen(p),b=screen(next);if(inside(a))arrow(a[0],a[1],a[0]-b[0],a[1]-b[1],'#87b8bd');}}
  }
  ctx.restore();ctx.font='12px "Microsoft YaHei",sans-serif';ctx.fillStyle='#bdd3db';
  if(cx>=4&&cx<w-4){ctx.textAlign=cx<w/2?'left':'right';ctx.fillText(earthR<3?'地球焦点（指示放大）':'地球 · 焦点',Math.max(12,Math.min(w-12,cx+(cx<w/2?8:-8))),Math.min(h-18,cy+(earthR<3?40:earthR+20)));}
  ctx.textAlign='left';ctx.fillStyle='#e0c17b';ctx.fillText(state.view==='near'?'近地点视窗':'整体轨道',14,23);
  ctx.fillStyle='#91abb8';const bar=64;ctx.fillRect(14,h-26,bar,1);ctx.fillText(n(bar/scale,0)+' km',14,h-10);
  if(px<16||px>w-16||py<16||py>h-16){ctx.textAlign='right';ctx.fillStyle='#ffda8f';ctx.fillText('飞行器在画面外',w-14,23);}
  // A focus-size indicator is deliberately explicit; never enlarge the physical Earth silently.
  if(state.view==='near'&&info.alpha>0&&info.e>.85){ctx.textAlign='right';ctx.fillStyle='#91abb8';ctx.fillText('远地点 '+n(info.apo/EARTH.radius,0)+' R⊕',w-14,h-12);}
 }
 function input(e){const key=e.target.dataset.conicKey;if(!key)return;let value=Number(e.target.value);if(!Number.isFinite(value))return;
  if(key==='totalHours'||key==='rateHours'){if(value<Number(e.target.min)||value>Number(e.target.max))return;state[key]=value;state.play=false;}
  else if(key==='progress'){state.progress=value;state.elapsed=value*state.totalHours*3600;state.play=false;}
  else{state[key]=value;rebuild();return;}
  update();draw();
 }
 function click(e){const b=e.target.closest('button');if(!b)return;
  if(b.dataset.conicView){state.view=b.dataset.conicView;geometry();}
  if(b.dataset.conicPreset){state.speed={circle:info.vc,ellipse:info.vc*1.3,parabola:info.escape,hyperbola:info.escape*1.12,drop:0}[b.dataset.conicPreset];rebuild();if(b.dataset.conicPreset==='ellipse')state.totalHours=info.period/3600;if(['parabola','hyperbola'].includes(b.dataset.conicPreset)){state.totalHours=24;state.view='whole';geometry();}state.rateHours=state.totalHours/20;}
  if(b.dataset.conicAction==='play'){if(!state.play&&state.elapsed>=Math.min(state.totalHours*3600,info.impactTime))state.elapsed=0;state.play=!state.play;last=performance.now();}
  if(b.dataset.conicAction==='reset'){Object.assign(state,defaults);rebuild();}
  if(b.dataset.conicAction==='period'&&!b.disabled){state.totalHours=info.period/3600;state.rateHours=state.totalHours/20;state.elapsed=0;state.play=false;}
  if(b.dataset.conicAction==='end'){state.elapsed=Math.min(state.totalHours*3600,info.impactTime);state.play=false;}
  update();draw();
 }
 function loop(now){frame=requestAnimationFrame(loop);const dt=Math.max(0,Math.min(.2,(now-last)/1000));last=now;if(active&&state.play){state.elapsed=Math.min(state.elapsed+dt*state.rateHours*3600,state.totalHours*3600,info.impactTime);if(state.elapsed>=Math.min(state.totalHours*3600,info.impactTime))state.play=false;update();if(now-lastPaint>30){draw();lastPaint=now;}}}
 function getState(){return {version:1,kind:'orbit-conics',height:state.height,speed:state.speed,totalHours:state.totalHours,rateHours:state.rateHours,elapsed:state.elapsed,view:state.view};}
 function applyState(candidate){
  const saved=validateExperimentModel('orbits','orbit',candidate);if(!saved)return false;
  // Apply inputs together before derived geometry; range replay would round
  // mathematical presets and restart the simulation at every input event.
  const {version,kind,...parameters}=saved;Object.assign(state,parameters,{play:false});
  info=conicState(state.height,state.speed);geometry();update();draw();return true;
 }
 slot.addEventListener('input',input);slot.addEventListener('click',click);const resize=new ResizeObserver(()=>draw());resize.observe(canvas);rebuild();frame=requestAnimationFrame(loop);
 return { state,getState,applyState,get result(){return result;},setActive(value){active=value;slot.hidden=!value;if(!value)state.play=false;else{update();draw();}},dispose(){cancelAnimationFrame(frame);resize.disconnect();slot.removeEventListener('input',input);slot.removeEventListener('click',click);earthImage.onload=null;} };
}
