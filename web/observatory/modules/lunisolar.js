import {applyPresentation,bindDisclosures,getGraphicStyle} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';
import {bindControls,syncControls} from '../shared/core-controls.js';
import {plot} from '../shared/plot.js';
import {drift,metonicDifference,calendarCase,monthName,dateAt,TROPICAL_YEAR,SYNODIC_MONTH} from './lunisolar-physics.mjs';

const defaults={years:8,cycle:'2025',leapMonth:'8',commonMonth:'8'};
const names={calendar:'月份与季节',intercalation:'朔日与闰月'};
const shortDate=date=>date.slice(5).replace('-','/');
const signed=(n,d=1)=>(n>0?'+':'')+n.toFixed(d);
function canvasSetup(canvas){
 const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(canvas.ownerDocument.defaultView.devicePixelRatio||1,2),style=getGraphicStyle(canvas);
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=style.background;c.fillRect(0,0,w,h);c.textBaseline='middle';return {c,w,h,s:style};
}
function text(c,s,label,x,y,align='left',numeric=false){c.fillStyle=s.text;c.font=numeric?s.tickFont:s.labelFont;c.textAlign=align;c.fillText(label,x,y);}
function diamond(c,x,y,r){c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y);c.closePath();c.fill();}
function hatch(c,x,y,w,h,color){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.strokeStyle=color;c.lineWidth=.8;for(let d=-h;d<w;d+=7){c.beginPath();c.moveTo(x+d,y+h);c.lineTo(x+d+h,y);c.stroke();}c.restore();}

export async function mount(el,{mode='calendar',signal}={}){
 if(signal?.aborted)return()=>{};
 const state={...defaults},doc=el.ownerDocument,win=doc.defaultView;let current=Object.hasOwn(names,mode)?mode:'calendar',disposed=false,frame=0;
 const cases={'2025':calendarCase('2025'),'2026':calendarCase('2026')};
 const options=id=>cases[id].months.slice(0,cases[id].count).map((month,i)=>`<option value="${i}">${monthName(month)} · ${shortDate(month.startDate)}</option>`).join('');
 el.innerHTML=`<section class="lunisolar-lab">
  <div class="al-mode-nav" role="group" aria-label="阴阳合历模式">${Object.entries(names).map(([id,name])=>`<button type="button" data-mode="${id}" aria-pressed="false">${name}</button>`).join('')}</div>
  <button type="button" class="al-button" data-reset>复位</button>
  <header class="lunisolar-heading"><h1>阴阳合历</h1><span data-ls-identity></span></header>
  <section data-ls-panel="calendar" aria-label="平均周期与季节漂移">
   <div class="lunisolar-year-control"><label class="al-parameter" for="lunisolar-years"><span>年序 n <output data-value="years"></output></span><input id="lunisolar-years" data-key="years" type="range" min="0" max="19" step="1"></label><button type="button" class="al-button" data-nineteen>19 年</button></div>
   <div class="lunisolar-calendar-figures"><figure><figcaption>同名月初的季节位置</figcaption><canvas data-ls-ring role="img"></canvas></figure><figure><figcaption>两种周期的累计差额</figcaption><canvas data-ls-drift role="img"></canvas></figure></div>
   <div class="lunisolar-readings"><span><b data-ls-month-count></b> 个朔望月</span><span>相对季节年 <b data-ls-drift-read></b> 日</span></div>
   <div class="lunisolar-metonic"><span>19 个回归年 <b>${(19*TROPICAL_YEAR).toFixed(4)} d</b></span><span>235 个朔望月 <b>${(235*SYNODIC_MONTH).toFixed(4)} d</b></span><span>差额 <b>+${metonicDifference().toFixed(4)} d</b></span></div>
  </section>
  <section data-ls-panel="intercalation" aria-label="朔日中气与月名安排" hidden>
   <div class="lunisolar-case-control"><label class="al-parameter" for="lunisolar-cycle">历表<select id="lunisolar-cycle" data-key="cycle"><option value="2025">2024—2025 冬至区间</option><option value="2026">2025—2026 冬至区间</option></select></label><output class="lunisolar-count" data-ls-count></output></div>
   <figure class="lunisolar-overview"><figcaption><span data-ls-range></span><span class="lunisolar-legend"><span>● 朔日</span><span>◆ 中气</span></span></figcaption><canvas data-ls-overview role="img" aria-label="两个冬至月间的农历月份与中气"></canvas></figure>
   <div class="lunisolar-selection"><label class="al-parameter" for="lunisolar-leap-month" data-ls-month-control="2025">月份<select id="lunisolar-leap-month" data-key="leapMonth">${options('2025')}</select></label><label class="al-parameter" for="lunisolar-common-month" data-ls-month-control="2026" hidden>月份<select id="lunisolar-common-month" data-key="commonMonth">${options('2026')}</select></label><div class="lunisolar-month-read"><strong data-ls-month-name></strong><span data-ls-month-dates></span></div></div>
   <figure class="lunisolar-detail"><canvas data-ls-detail role="img" aria-label="所选月份和相邻中气日期"></canvas></figure>
   <div class="lunisolar-readings"><span>本月中气 <b data-ls-terms></b></span><span>月长 <b data-ls-month-days></b> 日</span></div>
  </section>
  <details class="al-disclosure lunisolar-method" data-learning-guide><summary>周期、历表与来源</summary><p data-mode-boundary></p>
   <div data-ls-method="calendar"><p>平均回归年取 365.2422 日，平均朔望月取 29.5306 日。共同起点取冬至；每年十二个月的同名月初每次提前 10.875 日。季节圆环按平均回归年等分，图上位置表示累计时间差。</p><p>19 个回归年与 235 个平均朔望月的差为 0.0892 日。这里比较平均周期长度；现代农历的具体月份由朔日与中气的实际日期安排。</p></div>
   <div data-ls-method="intercalation"><p>日期摘自香港天文台公历与农历对照表，采用 UTC+8 民用日期。朔日作为初一，月区间从该日零时至下月初一零时。中气与朔发生在同一民用日时，中气归入当天开始的新月。图上标记按日期定位，日内时刻省略。</p><p>包含冬至的月份定为十一月。从一个十一月起至下一个十一月之前，若有十三个月，最先出现的不含中气月沿用前月月名，并加“闰”。本图展示 2025 闰六月与 2026 无闰月两个已核对区间；右端另保留下一十一月作冬至参照。</p></div>
   <p><a href="/sources/lunisolar.md" target="_blank" rel="noopener">历表出处、日期子集与计算方法 ↗</a></p>
  </details>
 </section>`;
 const shell=el.querySelector('.lunisolar-lab'),q=selector=>shell.querySelector(selector),qa=selector=>[...shell.querySelectorAll(selector)];
 function selectedMonth(){return Number(state.cycle==='2025'?state.leapMonth:state.commonMonth);}
 function drawCalendar(){
  const r=drift(state.years),{c,w,h,s}=canvasSetup(q('[data-ls-ring]')),cx=w/2,cy=h/2+4,radius=Math.max(45,Math.min(w*.30,h*.32));
  c.strokeStyle=s.grid;c.lineWidth=1;c.beginPath();c.arc(cx,cy,radius,0,2*Math.PI);c.stroke();
  const seasons=['冬至','春分','夏至','秋分'];
  seasons.forEach((name,i)=>{const a=-Math.PI/2+i*Math.PI/2,x=cx+Math.cos(a)*(radius+27),y=cy+Math.sin(a)*(radius+27);text(c,s,name,x,y,'center');});
  c.strokeStyle=s.muted;c.setLineDash([4,4]);c.beginPath();c.moveTo(cx,cy);c.lineTo(cx,cy-radius);c.stroke();c.setLineDash([]);
  for(let year=0;year<=19;year++){const a=-Math.PI/2+2*Math.PI*drift(year).phase,x=cx+radius*Math.cos(a),y=cy+radius*Math.sin(a);c.fillStyle=year<=state.years?s.accent:s.grid;c.beginPath();c.arc(x,y,year===state.years?6:2.5,0,Math.PI*2);c.fill();}
  const angle=-Math.PI/2+2*Math.PI*r.phase;c.strokeStyle=s.accent;c.lineWidth=2;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+radius*Math.cos(angle),cy+radius*Math.sin(angle));c.stroke();
  text(c,s,`n = ${state.years}`,cx,cy+25,'center',true);
  const chart=plot(q('[data-ls-drift]'),{series:[{points:[[0,0],[19,0]],label:'季节年',color:s.muted,dash:[5,4]},{points:[[0,0],[19,drift(19).delta]],label:'每年12个月',color:s.accent},{points:[[19,metonicDifference()]],label:'235个月',color:s.text,connect:false,dots:true,radius:5}],xDomain:[0,20],yDomain:[-220,20],xTicks:[0,5,10,15,19],yTicks:[-200,-150,-100,-50,0],xLabel:'年序 n',yLabel:'累计时差 / 日',margins:{left:58,right:20,top:w<400?87:65,bottom:49},onFontReady:false});
  const cc=q('[data-ls-drift]').getContext('2d'),[px,py]=chart.toPixel(state.years,r.delta);cc.fillStyle=s.background;cc.strokeStyle=s.accent;cc.lineWidth=2;cc.beginPath();cc.arc(px,py,5,0,Math.PI*2);cc.fill();cc.stroke();
  q('[data-ls-month-count]').textContent=r.months;q('[data-ls-drift-read]').textContent=signed(r.delta,3);
  q('[data-ls-ring]').setAttribute('aria-label',`平均周期模型：每年十二个月，第${state.years}次返回相对季节年提前${Math.abs(r.delta).toFixed(3)}日。`);
  q('[data-ls-drift]').setAttribute('aria-label',`每年十二个月的累计时差在第${state.years}年为${r.delta.toFixed(3)}日；19年与235个月之差为正0.0892日。`);
 }
 function drawOverview(data,index){
  const {c,w,h,s}=canvasSetup(q('[data-ls-overview]')),small=w<650,left=20,right=w-20,y=small?101:109,barH=44,x=day=>left+(day-data.start)/(data.end-data.start)*(right-left),chosen=data.months[index];
  c.strokeStyle=s.grid;c.lineWidth=1;
  data.months.forEach((m,i)=>{
   const a=x(m.start),b=x(m.end);c.fillStyle=i===index?s.accent:s.background;c.globalAlpha=i===index?.16:1;c.fillRect(a,y,b-a,barH);c.globalAlpha=1;
   if(m.leap)hatch(c,a,y,b-a,barH,s.accent);c.strokeStyle=i===index?s.accent:s.grid;c.strokeRect(a,y,b-a,barH);
   c.fillStyle=s.text;c.beginPath();c.arc(a,y,3,0,Math.PI*2);c.fill();
   if(!small)text(c,s,monthName(m),(a+b)/2,y+barH/2,'center');
  });
  data.terms.forEach((term,i)=>{
   const px=x(term.day),winter=term.name==='冬至';c.strokeStyle=winter?s.text:s.muted;c.setLineDash(winter?[]:[2,4]);c.beginPath();c.moveTo(px,winter?45:76);c.lineTo(px,y+barH+7);c.stroke();c.setLineDash([]);c.fillStyle=winter?s.text:s.accent;diamond(c,px,76,4);
   if(!small||winter){const align=i===0?'left':i===data.terms.length-1?'right':'center';text(c,s,winter?term.date.slice(0,4)+' 冬至':term.name,px,winter?27:(i%2?52:62),align);}
  });
  text(c,s,data.months[0].startDate,left,h-19,'left',true);text(c,s,dateAt(data.end),right,h-19,'right',true);
  if(small)text(c,s,monthName(chosen),(x(chosen.start)+x(chosen.end))/2,y+barH+25,'center');
  q('[data-ls-overview]').setAttribute('aria-label',`${data.winters[0].date}与${data.winters[1].date}所在十一月之间有${data.count}个月。${data.leapIndex>=0?'闰月为'+monthName(data.months[data.leapIndex]):'该区间无闰月'}。当前选中${monthName(chosen)}。`);
 }
 function drawDetail(data,index){
  const {c,w,h,s}=canvasSetup(q('[data-ls-detail]')),small=w<650,chosen=data.months[index],first=Math.max(0,index-1),last=Math.min(data.months.length-1,index+1),rows=data.months.slice(first,last+1),begin=rows[0].start,end=rows.at(-1).end,left=22,right=w-22,x=day=>left+(day-begin)/(end-begin)*(right-left),y=small?118:105,barH=56;
  rows.forEach(m=>{const a=x(m.start),b=x(m.end);c.fillStyle=m.index===index?s.accent:s.grid;c.globalAlpha=m.index===index?.16:.4;c.fillRect(a,y,b-a,barH);c.globalAlpha=1;if(m.leap)hatch(c,a,y,b-a,barH,s.accent);c.strokeStyle=s.muted;c.lineWidth=1;c.strokeRect(a,y,b-a,barH);c.fillStyle=s.text;c.beginPath();c.arc(a,y,4,0,Math.PI*2);c.fill();text(c,s,monthName(m),(a+b)/2,y+barH/2,'center');text(c,s,shortDate(m.startDate),a,y+barH+21,a===left?'left':'center',true);});
  text(c,s,shortDate(dateAt(end)),right,y+barH+21,'right',true);
  const events=data.terms.filter(t=>t.day>=begin&&t.day<end);
  events.forEach((t,i)=>{const px=x(t.day),rowY=small?(i%2?69:28):34;c.strokeStyle=s.accent;c.lineWidth=1;c.setLineDash([3,4]);c.beginPath();c.moveTo(px,rowY+18);c.lineTo(px,y+barH);c.stroke();c.setLineDash([]);c.fillStyle=s.accent;diamond(c,px,rowY+18,4);const align=px>right-25?'right':px<left+25?'left':'center';text(c,s,t.name,px,rowY,align);text(c,s,shortDate(t.date),px,rowY-17,align,true);});
  const boundaryDates=rows.map(m=>m.startDate);q('[data-ls-detail]').setAttribute('aria-label',`所选${monthName(chosen)}从${chosen.startDate}至${chosen.endDate}，${chosen.days}日。中气：${chosen.terms.map(t=>t.name+' '+t.date).join('、')||'无'}。邻近朔日：${boundaryDates.join('、')}。`);
 }
 function draw(){
  if(disposed||!shell.isConnected)return;
  if(current==='calendar')drawCalendar();
  else{
   const data=cases[state.cycle],index=selectedMonth(),m=data.months[index];
   q('[data-ls-count]').textContent=`${data.count} 个月 · ${data.leapIndex>=0?monthName(data.months[data.leapIndex]):'无闰月'}`;
   q('[data-ls-range]').textContent='十一月 → 下一十一月';
   for(const label of qa('[data-ls-month-control]'))label.hidden=label.dataset.lsMonthControl!==state.cycle;
   q('[data-ls-month-name]').textContent=monthName(m);q('[data-ls-month-dates]').textContent=`${m.startDate} — ${m.endDate}`;
   q('[data-ls-terms]').textContent=m.terms.map(t=>`${t.name} ${shortDate(t.date)}`).join(' · ')||'无';q('[data-ls-month-days]').textContent=m.days;
   drawOverview(data,index);drawDetail(data,index);
  }
 }
 const queue=()=>{if(disposed||frame)return;frame=win.requestAnimationFrame(()=>{frame=0;draw();});};
 function setMode(next){if(!Object.hasOwn(names,next))return;current=next;for(const b of qa('button[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===next));for(const p of qa('[data-ls-panel]'))p.hidden=p.dataset.lsPanel!==next;for(const p of qa('[data-ls-method]'))p.hidden=p.dataset.lsMethod!==next;q('[data-ls-identity]').textContent=next==='calendar'?'平均周期模型':'香港天文台历表 · UTC+8';draw();}
 const presentation=applyPresentation(shell,{surface:'paper',redraw:queue}),navigation=mountWorkspaceNavigation(shell,{modeNav:q('.al-mode-nav'),actions:[q('[data-reset]')],label:'阴阳合历实验导航'}),disclosures=bindDisclosures(shell),controls=bindControls(shell,state,queue);
 const click=event=>{const button=event.target.closest('button');if(!button||!shell.contains(button))return;if(button.dataset.mode)setMode(button.dataset.mode);else if(button.hasAttribute('data-reset')){Object.assign(state,defaults);syncControls(shell,state);draw();}else if(button.hasAttribute('data-nineteen')){state.years=19;syncControls(shell,state);draw();}};
 const point=event=>{const canvas=q('[data-ls-overview]'),rect=canvas.getBoundingClientRect(),data=cases[state.cycle],p=(event.clientX-rect.left-20)/(rect.width-40),day=data.start+p*(data.end-data.start),index=data.months.findIndex(m=>day>=m.start&&day<m.end);if(index<0||index>=data.count)return;const key=state.cycle==='2025'?'leapMonth':'commonMonth',input=q(`[data-key="${key}"]`);input.value=String(index);input.dispatchEvent(new win.Event('input',{bubbles:true}));};
 shell.addEventListener('click',click);q('[data-ls-overview]').addEventListener('click',point);const resize=new win.ResizeObserver(queue);resize.observe(shell);syncControls(shell,state);setMode(current);
 const dispose=()=>{if(disposed)return;disposed=true;win.cancelAnimationFrame(frame);resize.disconnect();shell.removeEventListener('click',click);q('[data-ls-overview]').removeEventListener('click',point);controls();disclosures();navigation();presentation();signal?.removeEventListener('abort',dispose);};signal?.addEventListener('abort',dispose,{once:true});return dispose;
}
