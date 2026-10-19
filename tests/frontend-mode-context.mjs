import assert from 'node:assert/strict';

// The 2026-10-19 presentation migration replaces old guide containers and
// arbitrary prose-length thresholds. Each route must still expose its named
// scientific subject and its mode-specific quantities/identity. Exact task,
// model, state, historical restoration and fault assertions remain elsewhere.
const semantics={
 'solar-system/explore':[/太阳|行星/,/距离|AU/],
 'solar-system/distance':[/距离/,/AU|天文单位/],
 'solar-system/sizes':[/半径|尺寸/,/地球/],
 'solar-system/compare':[/质量|密度|半径/,/线性|对数/],
 'solar-system/axes':[/自转|轴向/,/倾角|逆行|°/],
 'earth-moon/phase':[/月相|月亮/,/受光|光照/],
 'earth-moon/spin':[/自转|同步/,/月面|金点|地球/],
 'earth-moon/period':[/恒星月/,/朔望月/],
 'earth-moon/eclipse':[/日食|月食|日月食/,/倾角|交点|太阳|遮挡/],
 'alignments/venus':[/金星/,/距角|受光|相位/],
 'alignments/mars':[/火星/,/逆行|黄经/],
 'alignments/transit':[/凌星|圆面|恒星/,/通量|半径比/],
 'sky/sky':[/太阳|季节/,/纬度|昼长|高度/],
 'sky/stars':[/距离|视差/,/星|pc|秒差距/],
 'sky/measure':[/竖表|表影|影子|圭表/,/太阳|影长/],
 'sky/calendar':[/历|闰/,/季节年|365|年长/],
 'sky/day':[/恒星日/,/太阳日/],
 'sky/precession':[/岁差/,/地轴|天极|轴向/],
 'optics/imaging':[/像面|星像|接收面/,/mm|nm|近轴/],
 'optics/resolution':[/口径|分辨|细节/,/瑞利|视宁|nm|″/],
 'optics/sampling':[/像元|采样/,/″|角秒/],
 'light/thermal':[/温度|黑体/,/K|波长|nm/],
 'light/motion':[/运动|速度|谱线/,/km|波长|nm/],
 'light/magnitude':[/400.*500/,/600.*700/,/W\/m|绝对接收/,/通量比|FS\/FL/,/距离|pc/],
 'light/observing':[/曝光|观测|信噪/,/信噪|噪声|SNR/],
 'imaging/real':[/M17/,/源值|取样|通道|赋色/],
 'imaging/teaching':[/教学|计数|曝光/,/噪声|信噪|源值/],
 'stars/hr':[/温度/,/光度/,/半径/],
 'stars/evolution':[/演化|轨迹/,/模型|年龄|恒星/],
 'stars/pulsar':[/脉冲|中子星/,/相位|周期|光束/],
 'stars/collapse':[/核心/,/包层|外层/,/过程|无时间/,/独立/],
 'stars/ia':[/Ia|超新星/,/光变/,/样本/,/校正|残差/],
 'galaxy/galaxy':[/银河|银盘/,/太阳|银心|距离/],
 'galaxy/cmb':[/背景|CMB|全天/,/K|温度|微波/],
 'galaxy/cmb-spectrum':[/FIRAS/,/GHz/,/残差/,/MJy|kJy/],
 'orbits/orbit':[/轨道|椭圆|抛物/,/km|偏心|逃逸/],
 'orbits/transfer':[/转移/,/速度|Δv|km|km\/s/],
 'orbits/staging':[/分级|级/,/质量|Δv|载荷|kg/],
 'orbits/landing':[/着陆|下降/,/速度|高度|燃料/],
 'measure/shadow':[/影|太阳/,/角|纬度|地球/],
 'measure/jupiter':[/木星|木卫/,/质量|周期|kg/],
 'measure/s2':[/S2|银心/,/质量|轨道|年/],
 'measure/distance':[/距离|量距/,/pc|秒差距|Mpc|星等|视差/],
};

export async function installVisiblePlotTextProbe(context){
 await context.addInitScript(()=>{
  const records=new WeakMap(),fillText=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(...args){let a=records.get(this.canvas);if(!a){a=[];records.set(this.canvas,a);}a.push(String(args[0]));if(a.length>1200)a.splice(0,600);return fillText.apply(this,args);};
  window.__visiblePlotText=()=>Array.from(document.querySelectorAll('canvas')).filter(c=>{const r=c.getBoundingClientRect(),s=getComputedStyle(c);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';}).flatMap(c=>records.get(c)||[]).join('\n');
 });
}

export async function verifyPresentationContext(page,slug,mode){
 const key=slug+'/'+mode,requirements=semantics[key];assert(requirements,'No migrated semantic contract: '+key);
 const initialScroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));
 const opened=[];
 let externalConditions=null;
 if(slug==='alignments'){
  const entry=page.locator('button[aria-controls="alignment-information"]:visible');assert(await entry.count(),'Missing authored alignment conditions entry');
  if(!await page.locator('#alignment-information').evaluate(e=>e.open)){await entry.click();externalConditions=entry;}
  assert(await page.locator('#alignment-information').isVisible(),'Actual alignment conditions did not open');
 }
 // Use the actual authored disclosure, rather than resurrecting retired guides.
 for(const summary of await page.locator('details > summary:visible').all()){
  const name=(await summary.innerText()).trim();
  const containsToolSource=await summary.evaluate((e,slug)=>Array.from(e.parentElement.querySelectorAll('a[href]')).some(a=>{const p=new URL(a.href,location.href).pathname;return p==='/sources/'+slug+'.md'||p==='/labs/'+slug+'/SOURCES.md';}),slug);
  if((/读图|说明|当前关系|模型与来源/.test(name)||containsToolSource)&&!await summary.evaluate(e=>e.parentElement.open)){
   await summary.click();opened.push(summary);
  }
 }
 const observed=await page.evaluate(()=>({title:document.title,headings:Array.from(document.querySelectorAll('h1,h2')).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}).map(e=>e.textContent.trim()),text:document.body.innerText,plotText:window.__visiblePlotText?.()||''}));
 assert(observed.headings.some(t=>t.length>0),'No named scientific subject in '+key);
 for(const term of requirements)assert(term.test(observed.text+'\n'+observed.plotText),key+' missing scientific identity/quantity '+term);
 let sourceAccess=null;
 for(const link of await page.locator('a[href]').all()){
  const href=await link.getAttribute('href');let pathname;try{pathname=new URL(href,page.url()).pathname;}catch{continue;}
  if(!['/sources/'+slug+'.md','/labs/'+slug+'/SOURCES.md'].includes(pathname)||!await link.isVisible())continue;
  await link.focus();assert(await link.evaluate(e=>document.activeElement===e),'Tool source link cannot receive focus');sourceAccess={method:'visible focusable tool-specific source link',href:pathname,name:(await link.innerText()).trim()};break;
 }
 if(!sourceAccess&&['solar-system','earth-moon'].includes(slug)){
  const button=page.locator(slug==='solar-system'?'#sources-open':'#sources');let openedConditions=false;
  if(!await button.isVisible()&&slug==='earth-moon'){await page.locator('#condition-entry').click();openedConditions=true;}
  for(const detail of await button.locator('xpath=ancestor::details').all())if(!await detail.evaluate(e=>e.open))await detail.locator(':scope > summary').click();
  assert(await button.isVisible(),key+' tool source button is inaccessible');const name=(await button.innerText()).trim();await button.click();const dialog=page.locator('dialog[open]:visible').first();await dialog.waitFor();const text=(await dialog.innerText()).trim();assert(/NASA|JPL|来源|图注|资料/.test(text),'Opened source dialog lacks actual source information');sourceAccess={method:'visible tool-specific button opened model/source dialog',name,dialogText:text};await page.keyboard.press('Escape');assert(!await dialog.isVisible(),'Source dialog did not close on Escape');
  if(openedConditions&&await page.locator('#condition-menu').isVisible())await page.locator('[aria-label="关闭条件"]').click();
 }
 assert(sourceAccess,key+' has no actual reachable tool-specific model/source entry');
 assert(!/开发备注|工程候选|验收通过|待验收|本轮重构|不冒充|没有冒充/.test(observed.text),'Development/review copy exposed in '+key);
 for(const summary of opened.reverse())if(await summary.evaluate(e=>e.isConnected&&e.parentElement.open)){await summary.click();}
 if(externalConditions&&await page.locator('#alignment-information').evaluate(e=>e.open))await externalConditions.click();
 await page.evaluate(({x,y})=>scrollTo({left:x,top:y,behavior:'instant'}),initialScroll);
 return{headings:observed.headings,requiredSemantics:requirements.map(String),sourceAccess,scope:'Visible subject/quantities plus actual focusable source link or opened source dialog; old guide selectors and prose length are not scientific acceptance criteria',plotTextScope:'Accumulated fillText labels on currently visible canvases establish label presence only, not current-frame visibility, occlusion or geometry; screenshots and independent render/geometry tests remain required'};
}
