import {applyPresentation,bindDisclosures,getGraphicStyle} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';
import {bindControls,syncControls} from '../shared/core-controls.js';
import {plot} from '../shared/plot.js';
import {radiationBalance,greyAtmosphere,escapeDistribution,maxwellDensity} from './planet-environments-physics.mjs';

const modes={balance:'能量收支',atmosphere:'单层大气',escape:'热运动与逃逸'};
const defaults={distance:1,albedo:.3,emissivity:.77,gas:'H',temperature:1000,mass:1,radius:1,altitude:500,speedScale:'thermal'};
const gasLabels={H:'H 氢原子',H2:'H₂ 氢分子',He:'He 氦',N2:'N₂ 氮气',CO2:'CO₂ 二氧化碳'};
const reference={venus:{distance:.723,albedo:.77},earth:{distance:1,albedo:.3},mars:{distance:1.524,albedo:.25}};
const gravityReference={earth:{mass:1,radius:1},mars:{mass:.1074,radius:.532}};
const fixed=(n,d=1)=>n.toFixed(d);
const fraction=n=>n===0?'< 10⁻³⁰⁰':n<1e-5?n.toExponential(2):`${(n*100).toFixed(n<.001?4:2)}%`;
const parameter=(key,label,min,max,step,unit='')=>`<label class="al-parameter pe-parameter" for="pe-${key}"><span>${label}<output data-pe-value="${key}" class="al-number"></output></span><input id="pe-${key}" type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" aria-label="${unit?label.split(' / ')[0]+' / '+unit:label}"></label>`;

export async function mount(el,{mode='balance',signal}={}){
 if(signal?.aborted)return()=>{};
 const doc=el.ownerDocument,win=doc.defaultView,state={...defaults};let current=Object.hasOwn(modes,mode)?mode:'balance',disposed=false;
 const shell=doc.createElement('section');shell.className='pe-shell';shell.setAttribute('aria-label','行星环境');
 shell.innerHTML=`<div class="pe-mode-nav al-mode-nav" role="group" aria-label="行星环境模式">${Object.entries(modes).map(([key,label])=>`<button type="button" data-mode="${key}" aria-pressed="${key===current}">${label}</button>`).join('')}</div>
 <button class="al-button" type="button" data-reset>复位</button>
 <div class="pe-content"><header class="pe-heading"><div><h1 data-pe-title></h1><span class="pe-identity" data-pe-identity></span></div><div class="pe-temperature" data-pe-main-read></div></header>
 <section data-pe-panel="balance" aria-label="行星辐射平衡"><figure class="pe-figure"><canvas data-pe-canvas="balance" role="img" aria-label="太阳入射、反射和热辐射的能流图"></canvas></figure></section>
 <section data-pe-panel="atmosphere" aria-label="单层大气辐射交换"><figure class="pe-figure"><canvas data-pe-canvas="atmosphere" role="img" aria-label="地表和单层大气之间的红外辐射能流"></canvas></figure></section>
 <section data-pe-panel="escape" aria-label="分子速度分布"><figure class="pe-figure"><canvas data-pe-canvas="escape" role="img" aria-label="麦克斯韦速度分布和逃逸速度"></canvas></figure><div class="pe-escape-read" data-pe-escape-read></div></section>
 <div class="pe-controls" data-pe-radiation-controls>
 ${parameter('distance','日距 / AU',.5,2.5,.001,'AU')}${parameter('albedo','邦德反照率 A',0,1,.001)}
 <div class="pe-reference"><span>日距与反照率</span><div class="al-mode-nav" role="group" aria-label="行星参考参数"><button type="button" data-pe-reference="venus">金星</button><button type="button" data-pe-reference="earth">地球</button><button type="button" data-pe-reference="mars">火星</button></div></div></div>
 <div class="pe-controls pe-emissivity" data-pe-atmosphere-controls>${parameter('emissivity','大气红外发射率 ε',0,1,.01)}</div>
 <div class="pe-controls pe-escape-controls" data-pe-escape-controls>
 <label class="al-parameter"><span>气体</span><select data-key="gas">${Object.entries(gasLabels).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label>
 ${parameter('temperature','高层气体温度 / K',100,3000,10,'K')}
 ${parameter('mass','行星质量 / M⊕',.01,2,.0001,'地球质量')}${parameter('radius','行星半径 / R⊕',.1,2.5,.0001,'地球半径')}${parameter('altitude','高度 / km',0,3000,10,'km')}
 <label class="al-parameter"><span>横轴范围</span><select data-key="speedScale"><option value="thermal">热运动尺度</option><option value="escape">包含逃逸速度</option></select></label>
 <div class="pe-reference"><span>质量与半径</span><div class="al-mode-nav" role="group" aria-label="引力参考参数"><button type="button" data-pe-gravity="earth">地球</button><button type="button" data-pe-gravity="mars">火星</button></div></div></div>
 <details class="pe-method al-disclosure" data-learning-guide><summary>模型与来源</summary><div class="pe-method-content">
 <p data-mode-boundary></p>
 <div data-pe-method="balance"><p>太阳辐照度 S = 1361/r² W m⁻²。球的截光面积为 πR²，散热面积为 4πR²，故全球平均入射为 S/4。模型取均匀温度、黑体热辐射和可忽略的内部热源。</p><p class="al-number">Q = (1−A)S/4 = σTₑq⁴</p><p>箭身宽度与全球平均能流成正比；同一视口的比例尺随日距和反照率保持固定。参考按钮采用行星日距和近似邦德反照率。</p></div>
 <div data-pe-method="atmosphere"><p>短波穿过大气后由地表吸收 Q；地表为黑体，大气为均温的单层灰体，红外吸收率与发射率同为 ε。各层达到辐射平衡。</p><p class="al-number">Fₛ = Q/(1−ε/2)　Tₛ = (Fₛ/σ)¼</p><p>大气吸收 εFₛ，向上、向下各发射 εFₛ/2。ε &gt; 0 时，Tₐ = Tₛ/2¼。ε = 0 时大气与红外辐射解耦，辐射平衡对其温度没有约束。</p><p>箭身宽度共用固定能流比例尺。该模型只计辐射交换；真实大气还包括垂直结构、对流、潜热和随波长变化的吸收。</p></div>
 <div data-pe-method="escape"><p>曲线给出选定高层温度下的麦克斯韦速率分布，阴影为速率高于 vₑₛc 的粒子比例。半径取行星平均半径，高度从该表面起算；引力势采用球对称、静止天体。</p><p class="al-number">vₑₛc = √[2GM/(R+h)]　vₚ = √(2kT/m)　λ = (vₑₛc/vₚ)²</p><p>逃逸通量还涉及粒子数密度、向外的运动方向、碰撞和高层输运。这里计算局地速度分布及其高能尾部。</p><p>各气体的粒子质量依次取 1、2、4、28、44 u。参考按钮只改变质量与半径，高层温度及高度由相邻控件指定。</p></div>
 <p><a href="/sources/planet-environments.md" target="_blank" rel="noopener">公式、参数与来源 ↗</a></p></div></details></div>`;
 el.append(shell);
 const q=s=>shell.querySelector(s),qa=s=>[...shell.querySelectorAll(s)];
 const disposePresentation=applyPresentation(shell,{surface:'paper',redraw:draw});
 const disposeNavigation=mountWorkspaceNavigation(shell,{modeNav:q('.pe-mode-nav'),actions:[q('[data-reset]')],label:'行星环境导航'});
 const disposeDisclosures=bindDisclosures(shell);
 const disposeControls=bindControls(shell,state,()=>{updateReadouts();draw();});
 function updateReadouts(){
  const formats={distance:3,albedo:3,emissivity:2,temperature:0,mass:4,radius:4,altitude:0};
  for(const node of qa('[data-pe-value]'))node.textContent=fixed(state[node.dataset.peValue],formats[node.dataset.peValue]);
  for(const button of qa('[data-pe-reference]'))button.setAttribute('aria-pressed',String(Object.entries(reference[button.dataset.peReference]).every(([k,v])=>Math.abs(state[k]-v)<1e-10)));
  for(const button of qa('[data-pe-gravity]'))button.setAttribute('aria-pressed',String(Object.entries(gravityReference[button.dataset.peGravity]).every(([k,v])=>Math.abs(state[k]-v)<1e-10)));
 }
 function setMode(next){
  if(!Object.hasOwn(modes,next))return;current=next;
  for(const button of qa('[data-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mode===current));
  for(const panel of qa('[data-pe-panel]'))panel.hidden=panel.dataset.pePanel!==current;
  for(const method of qa('[data-pe-method]'))method.hidden=method.dataset.peMethod!==current;
  q('[data-pe-radiation-controls]').hidden=current==='escape';q('[data-pe-atmosphere-controls]').hidden=current!=='atmosphere';q('[data-pe-escape-controls]').hidden=current!=='escape';
  q('[data-pe-title]').textContent={balance:'日光与辐射平衡',atmosphere:'地表与大气的辐射交换',escape:'热运动与引力束缚'}[current];
  q('[data-pe-identity]').textContent=current==='escape'?'局地麦克斯韦分布':'全球平均 · 辐射平衡模型';
  draw();
 }
 function click(event){
  const button=event.target.closest('button');if(!button||!shell.contains(button))return;
  if(button.hasAttribute('data-mode'))setMode(button.dataset.mode);
  else if(button.hasAttribute('data-reset')){Object.assign(state,defaults);syncControls(shell,state);updateReadouts();draw();}
  else if(button.hasAttribute('data-pe-reference')){Object.assign(state,reference[button.dataset.peReference]);syncControls(shell,state);updateReadouts();draw();}
  else if(button.hasAttribute('data-pe-gravity')){Object.assign(state,gravityReference[button.dataset.peGravity]);syncControls(shell,state);updateReadouts();draw();}
 }
 shell.addEventListener('click',click);
 const observer=new win.ResizeObserver(()=>draw());observer.observe(shell);
 function setup(canvas){
  const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(win.devicePixelRatio||1,2),style=getGraphicStyle(canvas);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,width,height);c.lineCap='butt';
  return {c,w:width,h:height,s:style,mobile:width<560};
 }
 function text(c,s,value,x,y,align='left',numeric=false){c.font=numeric?s.tickFont:s.labelFont;c.textAlign=align;c.textBaseline='middle';c.fillStyle=s.text;c.fillText(value,x,y);}
 function arrow(c,points,width,color){
  if(!(width>0))return;c.strokeStyle=color;c.fillStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
  const [x,y]=points.at(-1),[px,py]=points.at(-2),angle=Math.atan2(y-py,x-px),head=Math.max(5,Math.min(12,width*.65));
  c.beginPath();c.moveTo(x+Math.cos(angle)*head,y+Math.sin(angle)*head);c.lineTo(x+Math.cos(angle+Math.PI/2)*width*.65,y+Math.sin(angle+Math.PI/2)*width*.65);c.lineTo(x+Math.cos(angle-Math.PI/2)*width*.65,y+Math.sin(angle-Math.PI/2)*width*.65);c.closePath();c.fill();
 }
 function drawBalance(){
  const canvas=q('[data-pe-canvas="balance"]'),{c,w,h,s,mobile}=setup(canvas),m=radiationBalance(state.distance,state.albedo);
  q('[data-pe-main-read]').innerHTML=`<span>平衡温度 Tₑq</span><strong class="al-number">${fixed(m.equilibriumTemperature)} <small>K</small></strong>`;
  const cx=w*(mobile?.44:.48),cy=mobile?217:180,r=mobile?51:65,k=mobile?.038:.058;
  c.fillStyle=s.grid;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();c.strokeStyle=s.text;c.lineWidth=1.3;c.stroke();
  c.save();c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.clip();c.strokeStyle=s.muted;c.lineWidth=1;c.beginPath();c.ellipse(cx,cy,r*.35,r,0,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(cx,cy,r,r*.30,0,0,Math.PI*2);c.stroke();c.restore();
  if(mobile){
   const left=w*.17,right=w*.82;
   arrow(c,[[left,84],[left,cy-36],[cx-r*.9,cy-36]],m.incoming*k,s.text);
   arrow(c,[[cx+r*.72,cy-35],[right,cy-35],[right,87]],m.reflected*k,s.muted);
   arrow(c,[[cx+r*.72,cy+35],[right,cy+35],[right,337]],m.absorbed*k,s.accent);
   text(c,s,'入射 S/4',16,29);text(c,s,fixed(m.incoming),16,53,'left',true);
   text(c,s,'反射',w-16,29,'right');text(c,s,fixed(m.reflected),w-16,53,'right',true);
   text(c,s,'热辐射',w-16,377,'right');text(c,s,fixed(m.absorbed),w-16,401,'right',true);
   text(c,s,'W m⁻²',16,401);text(c,s,`吸收 ${fixed(m.absorbed)}`,cx,cy+91,'center',true);
  }else{
   arrow(c,[[32,cy],[cx-r-12,cy]],m.incoming*k,s.text);
   arrow(c,[[cx+r*.75,cy-38],[w*.77,cy-38],[w*.77,79],[w-44,79]],m.reflected*k,s.muted);
   arrow(c,[[cx+r*.75,cy+38],[w*.77,cy+38],[w*.77,281],[w-44,281]],m.absorbed*k,s.accent);
   text(c,s,'太阳入射 S/4',32,cy-54);text(c,s,fixed(m.incoming),32,cy-30,'left',true);
   text(c,s,'反射',w-30,30,'right');text(c,s,fixed(m.reflected),w-30,54,'right',true);
   text(c,s,'热辐射',w-30,320,'right');text(c,s,fixed(m.absorbed),w-30,344,'right',true);
   text(c,s,`吸收 ${fixed(m.absorbed)}`,cx,cy+r+35,'center',true);text(c,s,'W m⁻²',32,h-22);
  }
  canvas.setAttribute('aria-label',`全球平均能流，单位瓦每平方米：入射 ${fixed(m.incoming)}，反射 ${fixed(m.reflected)}，吸收和热辐射均为 ${fixed(m.absorbed)}。平衡温度 ${fixed(m.equilibriumTemperature)} 开尔文。`);
 }
 function drawAtmosphere(){
  const canvas=q('[data-pe-canvas="atmosphere"]'),{c,w,h,s,mobile}=setup(canvas),m=greyAtmosphere(state.distance,state.albedo,state.emissivity);
  q('[data-pe-main-read]').innerHTML=`<span>地表 Tₛ</span><strong class="al-number">${fixed(m.surfaceTemperature)} <small>K</small></strong>`;
  const x=[.13,.36,.61,.85].map(f=>w*f),layer=mobile?193:177,surface=h-88,k=mobile?.018:.03;
  c.fillStyle=s.grid;c.globalAlpha=.38+state.emissivity*.5;c.fillRect(12,layer-10,w-24,24);c.globalAlpha=1;
  c.strokeStyle=s.text;c.lineWidth=2;c.beginPath();c.moveTo(12,surface);c.lineTo(w-12,surface);c.stroke();
  text(c,s,'日光吸收',x[0],25,'center');text(c,s,fixed(m.absorbed),x[0],49,'center',true);
  text(c,s,mobile?'直出':'地表直达太空',x[1],25,'center');text(c,s,fixed(m.transmitted),x[1],49,'center',true);
  text(c,s,mobile?'向上':'大气向上',x[2],25,'center');text(c,s,fixed(m.atmosphereUp),x[2],49,'center',true);
  arrow(c,[[x[0],73],[x[0],surface-11]],m.absorbed*k,s.text);
  arrow(c,[[x[1],surface-13],[x[1],layer+24]],m.surfaceFlux*k,s.accent);
  arrow(c,[[x[1],layer-20],[x[1],76]],m.transmitted*k,s.accent);
  arrow(c,[[x[2],layer-20],[x[2],76]],m.atmosphereUp*k,s.accent);
  arrow(c,[[x[3],layer+24],[x[3],surface-11]],m.atmosphereDown*k,s.accent);
  const ta=m.atmosphereTemperature===null?'—':fixed(m.atmosphereTemperature);
  text(c,s,'Tₐ / K',x[3],25,'center');text(c,s,ta,x[3],49,'center',true);text(c,s,'大气',w-18,layer+2,'right');
  text(c,s,mobile?'发射':'地表发射',x[1],surface+27,'center');text(c,s,fixed(m.surfaceFlux),x[1],surface+51,'center',true);
  text(c,s,mobile?'向下':'大气向下',x[3],surface+27,'center');text(c,s,fixed(m.atmosphereDown),x[3],surface+51,'center',true);
  text(c,s,'地表',16,surface+27);text(c,s,'W m⁻²',16,h-12);
  canvas.setAttribute('aria-label',`单层大气稳态辐射，单位瓦每平方米：太阳吸收 ${fixed(m.absorbed)}，地表发射 ${fixed(m.surfaceFlux)}，地表直出 ${fixed(m.transmitted)}，大气向上和向下各 ${fixed(m.atmosphereUp)}。地表温度 ${fixed(m.surfaceTemperature)} 开尔文，大气温度 ${ta}。`);
 }
 function drawEscape(){
  const canvas=q('[data-pe-canvas="escape"]'),m=escapeDistribution(state),s=getGraphicStyle(canvas);
  q('[data-pe-main-read]').innerHTML=`<span>逃逸速度 vₑₛc</span><strong class="al-number">${fixed(m.escape,2)} <small>km/s</small></strong>`;
  q('[data-pe-escape-read]').innerHTML=`<span>峰值速度 <b class="al-number">${fixed(m.peak,2)} km/s</b></span><span>λ <b class="al-number">${fixed(m.lambda,2)}</b></span><span>v ≥ vₑₛc <b class="al-number">${fraction(m.tail)}</b></span>`;
  const xMax=state.speedScale==='escape'?Math.max(4*m.peak,m.escape*1.12):4*m.peak,yMax=maxwellDensity(m.peak,state.temperature,m.molecularMass)*1.3;
  const points=Array.from({length:601},(_,i)=>{const v=xMax*i/600;return[v,maxwellDensity(v,state.temperature,m.molecularMass)];});
  const result=plot(canvas,{series:[{points,color:s.text}],xDomain:[0,xMax],yDomain:[0,yMax],xLabel:'速率 / km s⁻¹',yLabel:'概率密度 / (km s⁻¹)⁻¹',showLegend:false,margins:{top:55,left:canvas.clientWidth<400?56:72,right:18,bottom:53},onFontReady:false});
  const c=canvas.getContext('2d'),{bounds,toPixel}=result;c.save();c.beginPath();c.rect(bounds.x,bounds.y,bounds.width,bounds.height);c.clip();
  if(m.escape<xMax){
   const tail=[[m.escape,0],[m.escape,maxwellDensity(m.escape,state.temperature,m.molecularMass)],...points.filter(p=>p[0]>m.escape),[xMax,0]];
   c.beginPath();tail.forEach((p,i)=>{const [x,y]=toPixel(...p);i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.fillStyle=s.accent;c.globalAlpha=.26;c.fill();c.globalAlpha=1;
   const [x]=toPixel(m.escape,0);c.strokeStyle=s.accent;c.lineWidth=1.5;c.setLineDash([5,4]);c.beginPath();c.moveTo(x,bounds.y);c.lineTo(x,bounds.y+bounds.height);c.stroke();c.setLineDash([]);
  }c.restore();
  c.font=s.labelFont;c.fillStyle=s.accent;c.textAlign='right';c.textBaseline='middle';
  const marker=m.escape>=xMax?`vₑₛc ${fixed(m.escape,2)} →`:`vₑₛc ${fixed(m.escape,2)}`;
  c.fillText(marker,result.width-19,37);
  canvas.setAttribute('aria-label',`${gasLabels[state.gas]}，${state.temperature} 开尔文。峰值速度 ${fixed(m.peak,2)} 千米每秒，逃逸速度 ${fixed(m.escape,2)} 千米每秒，速率超过逃逸速度的比例 ${fraction(m.tail)}。`);
 }
 function draw(){if(disposed||!shell.isConnected)return;if(current==='balance')drawBalance();else if(current==='atmosphere')drawAtmosphere();else drawEscape();}
 updateReadouts();setMode(current);
 const dispose=()=>{if(disposed)return;disposed=true;observer.disconnect();disposeControls();disposeDisclosures();disposeNavigation();disposePresentation();shell.removeEventListener('click',click);signal?.removeEventListener('abort',dispose);shell.remove();};
 signal?.addEventListener('abort',dispose,{once:true});return dispose;
}
