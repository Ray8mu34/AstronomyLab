// Shared browser observations. These checks supplement, rather than replace,
// each mode's scientific task and human/assistive-technology review.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import crypto from 'node:crypto';
import os from 'node:os';

const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const base=option('--base','http://127.0.0.1:4392');
const out=path.resolve(option('--out','build/qa/frontend-round2-20261019/audit'));
const phase=option('--phase','after'),routesFile=option('--routes-file',null);
const routes=routesFile?JSON.parse(fs.readFileSync(routesFile,'utf8')):[['home','/'],['phase','/labs/earth-moon/?mode=phase'],['sampling','/lab/optics?mode=sampling'],['firas','/lab/galaxy?mode=cmb-spectrum'],['hr','/lab/stars?mode=hr'],['imaging','/lab/imaging?mode=real']];
const viewportOption=option('--viewport',null);
const viewports=viewportOption?[(()=>{const m=/^(\d+)x(\d+)$/.exec(viewportOption);if(!m)throw Error('--viewport requires WIDTHxHEIGHT');return{width:Number(m[1]),height:Number(m[2])};})()]:[{width:1440,height:900},{width:1280,height:600},{width:768,height:1024},{width:390,height:844},{width:320,height:720}];
const {chromium}=createRequire(import.meta.url)(option('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright'));
const executablePath=option('--browser',process.env.BROWSER_EXECUTABLE);
const startedAt=new Date().toISOString(),observations=[],errors=[];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...(executablePath?{executablePath}:{}),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const browserVersion=browser.version();
const packageRoot=option('--package',null),manifestSource=packageRoot?path.join(packageRoot,'web/observatory/runtime-assets.json'):null;
const manifestSHA256=manifestSource?crypto.createHash('sha256').update(fs.readFileSync(manifestSource)).digest('hex'):null;
try{
 for(const [slug,url] of routes)for(const viewport of viewports){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce'}),page=await context.newPage();
  const runtimeErrors=[],failedResponses=[],blockedExternal=[];
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==new URL(base).origin&&!['data:','blob:'].includes(u.protocol)){blockedExternal.push(u.origin+u.pathname);return route.abort();}return route.continue();});
  page.on('pageerror',e=>runtimeErrors.push(e.message));page.on('response',r=>{if(r.status()>=400)failedResponses.push({status:r.status(),url:new URL(r.url()).pathname});});
  await page.addInitScript(()=>{
   window.__round2Perf={lcp:[],shifts:[],events:[],longTasks:[]};
   for(const [type,key]of [['largest-contentful-paint','lcp'],['layout-shift','shifts'],['event','events'],['longtask','longTasks']])try{new PerformanceObserver(list=>{for(const e of list.getEntries()){const item={startTime:e.startTime,duration:e.duration};if(type==='largest-contentful-paint')Object.assign(item,{size:e.size,url:e.url,tag:e.element?.tagName});if(type==='layout-shift')Object.assign(item,{value:e.value,hadRecentInput:e.hadRecentInput,sources:(e.sources||[]).map(s=>({node:s.node?.id?'#'+s.node.id:s.node?.tagName?.toLowerCase()+(typeof s.node?.className==='string'?'.'+s.node.className.trim().split(/\s+/).join('.'):''),previousRect:s.previousRect.toJSON(),currentRect:s.currentRect.toJSON()}))});if(type==='event')Object.assign(item,{name:e.name,interactionId:e.interactionId,processingStart:e.processingStart,processingEnd:e.processingEnd});window.__round2Perf[key].push(item);}}).observe({type,buffered:true,...(type==='event'?{durationThreshold:16}:{})});}catch{}
  });
  try{
   await page.goto(base+url,{waitUntil:'networkidle',timeout:60000});
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(350);
   const beforeInput=await page.evaluate(()=>{
    const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    const path=e=>e.id?'#'+e.id:e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'');
    const names=e=>e.getAttribute('aria-label')||e.getAttribute('title')||(e.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>document.getElementById(id)?.textContent||'').join(' ')||Array.from(e.labels||[]).map(l=>l.textContent).join(' ')||e.textContent||e.getAttribute('alt')||e.value||'';
    const controls=Array.from(document.querySelectorAll('button,input,select,textarea,a[href],[role="button"],[role="slider"],summary')).filter(visible).map(e=>{const r=e.getBoundingClientRect();return{path:path(e),tag:e.tagName,type:e.type||e.getAttribute('role'),name:names(e).trim().slice(0,120),disabled:!!e.disabled,width:r.width,height:r.height,smallTarget:r.width<24||r.height<24};});
    const notePattern=/(?:开发备注|开发阶段|工程候选|验收措辞|验收通过|待验收|P[012]样板|第一轮科学|第二轮前端|本轮重构|尚未实现|占位(?:符|图|页面)|没有冒充|不冒充|不声称|不伪装|不构成[^。\n]{0,12}验收|TODO|FIXME)/i;
    const notes=[];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const n=walker.currentNode,e=n.parentElement;if(e&&!['SCRIPT','STYLE','NOSCRIPT'].includes(e.tagName)&&visible(e)&&notePattern.test(n.textContent))notes.push({path:path(e),text:n.textContent.trim().slice(0,180)});}
    const resources=performance.getEntriesByType('resource').map(e=>({url:e.name,initiatorType:e.initiatorType,transferSize:e.transferSize,encodedBodySize:e.encodedBodySize,decodedBodySize:e.decodedBodySize,duration:e.duration}));
    const fontResources=resources.filter(r=>/\.(?:woff2?|ttf)(?:$|\?)/i.test(r.url)),imageResources=resources.filter(r=>r.initiatorType==='img');
    const fontStates=Array.from(document.fonts).map(f=>({family:f.family,weight:f.weight,status:f.status,unicodeRange:f.unicodeRange}));
    const animated=Array.from(document.querySelectorAll('*')).filter(visible).map(e=>({path:path(e),animationName:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration,transition:getComputedStyle(e).transitionDuration})).filter(e=>e.animationName!=='none'||e.transition.split(',').some(t=>parseFloat(t)>0));
    return{metrics:{innerWidth,innerHeight,devicePixelRatio,scrollWidth:document.documentElement.scrollWidth,cssZoom:getComputedStyle(document.body).zoom,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches},lifecycle:{timeOrigin:performance.timeOrigin,navigation:performance.getEntriesByType('navigation')[0]?.toJSON(),paint:performance.getEntriesByType('paint').map(p=>p.toJSON()),fontsStatus:document.fonts.status,observedAt:performance.now(),visibility:document.visibilityState},title:document.title,visibleText:document.body.innerText,controls,notes,fontStates,fontResources,imageResources,resources,animated,perf:structuredClone(window.__round2Perf)};
   });
   const cdp=await context.newCDPSession(page),ax=await cdp.send('Accessibility.getFullAXTree');
   const unnamedAX=ax.nodes.filter(n=>!n.ignored&&['button','link','textbox','slider','combobox','checkbox','radio','spinbutton'].includes(n.role?.value)&&!n.name?.value).map(n=>({role:n.role?.value,backendDOMNodeId:n.backendDOMNodeId}));
   for(const item of unnamedAX)if(item.backendDOMNodeId){const {node}=await cdp.send('DOM.describeNode',{backendNodeId:item.backendDOMNodeId});item.element={tag:node.localName,attributes:node.attributes};}await cdp.detach();
   const focus=[];for(let i=0;i<12;i++){await page.keyboard.press('Tab');focus.push(await page.evaluate(()=>{const e=document.activeElement,r=e?.getBoundingClientRect(),s=e?getComputedStyle(e):null;const x=r?Math.max(0,Math.min(innerWidth-1,r.left+r.width/2)):0,y=r?Math.max(0,Math.min(innerHeight-1,r.top+r.height/2)):0;const top=document.elementFromPoint(x,y);return{tag:e?.tagName,id:e?.id,name:(e?.getAttribute('aria-label')||e?.textContent||e?.value||'').trim().slice(0,80),inViewport:!!r&&r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,centerUnoccluded:!!e&&!!top&&(e===top||e.contains(top)),outlineStyle:s?.outlineStyle,outlineWidth:s?.outlineWidth,boxShadow:s?.boxShadow};}));}
   await page.keyboard.press('Shift+Tab');await page.keyboard.press('Escape');await page.waitForTimeout(100);
   const afterInput=await page.evaluate(()=>structuredClone(window.__round2Perf));
   await page.mouse.click(1,1);await page.evaluate(()=>scrollTo(0,0));
   const screenshot=slug+'-'+viewport.width+'x'+viewport.height+'.png';await page.screenshot({path:path.join(out,screenshot),fullPage:true});
   const png=fs.readFileSync(path.join(out,screenshot)),screenshotSize={width:png.readUInt32BE(16),height:png.readUInt32BE(20)};
   // CLS uses session windows, excluding shifts immediately following input.
   let cls=0,windowSum=0,windowStart=0,last=0;for(const s of beforeInput.perf.shifts.filter(s=>!s.hadRecentInput)){if(s.startTime-last>1000||s.startTime-windowStart>5000){windowStart=s.startTime;windowSum=0;}windowSum+=s.value;cls=Math.max(cls,windowSum);last=s.startTime;}
   const lcp=beforeInput.perf.lcp.at(-1)?.startTime??null,initialFontBytes=beforeInput.fontResources.reduce((n,r)=>n+r.encodedBodySize,0),initialImageBytes=beforeInput.imageResources.reduce((n,r)=>n+r.encodedBodySize,0);
   const issues=[];if(beforeInput.metrics.innerWidth!==viewport.width||beforeInput.metrics.innerHeight!==viewport.height)issues.push('viewport-mismatch');if(beforeInput.metrics.scrollWidth>viewport.width+1)issues.push('horizontal-overflow');if(runtimeErrors.length)issues.push('uncaught-errors');if(failedResponses.length)issues.push('failed-responses');if(beforeInput.notes.length)issues.push('developer-copy');if(cls>0.1)issues.push('cls-budget');if(lcp!==null&&lcp>2500)issues.push('lcp-budget');if(unnamedAX.length)issues.push('unnamed-accessible-control');if(slug==='home'&&initialFontBytes>350000)issues.push('home-font-budget');if(slug==='home'&&initialImageBytes>600000)issues.push('home-image-budget');
   observations.push({slug,url,viewport,screenshot,screenshotSize,state:issues.length?'observations-require-review':'observed',issues,...beforeInput,unnamedAX,focus,afterInput,runtimeErrors,failedResponses,blockedExternal,performance:{lcp,cls,initialFontBytes,initialImageBytes,limits:{lcp:2500,cls:0.1,homeFontBytes:350000,homeImageBytes:600000},budgetFlags:{lcp:lcp!==null&&lcp>2500,cls:cls>0.1,homeFont:slug==='home'&&initialFontBytes>350000,homeImages:slug==='home'&&initialImageBytes>600000},interactionScope:'12 trusted Tab inputs, Shift+Tab and Escape; sampled Event Timing is not field INP'}});
   console.log(JSON.stringify({slug,viewport,state:issues.length?'review':'observed',issues,lcp,cls,initialFontBytes}));
  }catch(e){errors.push({slug,viewport,error:e.stack});console.error(slug,viewport.width,e.message);}
  finally{await context.close();fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify({startedAt,updatedAt:new Date().toISOString(),command:process.argv,phase,base,browserVersion,manifestSource,manifestSHA256,environment:{browser:'Headless Edge/Chromium',graphics:'SwiftShader',network:'localhost; external requests blocked; fresh context per route and viewport',cpu:'unthrottled',cpuModel:os.cpus()[0]?.model,logicalCPUs:os.cpus().length,backgroundActivity:'Other local development processes are not controlled; these observations are not lab-isolated benchmarks.',realDevice:false,projection:false,assistiveTechnology:false},scope:'DOM/AX-name, target-size and keyboard observations; manual contrast, task focus order, canvas labels and screen-reader behavior require separate review',observations,errors},null,2));}
 }
}finally{await browser.close();}
if(errors.length)process.exitCode=1;
