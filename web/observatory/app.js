import {prepareEditorial,applyEditorial} from "./shared/editorial.js";
import {navigation} from './shared/navigation.js';
import {labs,topics,lessonEntries,confirmedModes,experimentURL,labURL} from './shared/course-map.js';
import {enterMode} from './shared/mode-entry.js';
import {pathsForLesson} from './shared/learning-paths.js';
import {loadJSON,loadArticleHTML,parseArticleHTML,validCatalog,validStatus,validIntegration,createRouteRequests} from './shared/load-content.js';
import {createHistoryState,ensureHistoryEntry,routeAddress,createReadingStore,indexReadingBlocks,captureReadingPosition,restoreReadingPosition,restorationTarget,decodeAnchor} from './shared/reading-state.js';
import {captureExperiment,restoreExperiment,bindExperimentState} from './shared/experiment-state.js';
const app=document.getElementById('app');let cleanup=null,catalog=null,activePage=null;
const requests=createRouteRequests();
let sessionStore;try{sessionStore=window.sessionStorage;}catch{}
const readingStore=createReadingStore(sessionStore);
try{history.scrollRestoration='manual';}catch{}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusLabel=s=>({passed:'已通过',checked_views_passed:'已查看的视图通过',pending:'待进行',failed:'未通过',partial:'部分完成',in_progress:'进行中',checked_with_limits:'已核查，存在限定'})[s]||s;
function card(l){const entry=l.slug==='alignments'?'mars':l.slug==='optics'?'resolution':null;return `<a class="lab-card experiment-row" data-topic="${l.topic}" href="${experimentURL(l.slug,entry)}"><span class="directory-number">第${l.tag}讲</span><div><h3>${l.question}</h3><p>${l.title}</p></div><span class="directory-arrow" aria-hidden="true">→</span></a>`;}
function targetsFor(number){const targets=(lessonEntries[number]?.targets||[]).filter(t=>!t.mode||confirmedModes[t.slug]?.includes(t.mode));return targets.length?targets:labs.filter(l=>l.lessons.includes(number)).map(l=>({slug:l.slug,label:l.title}));}
function targetLinks(number){return targetsFor(number).map(t=>`<a href="${experimentURL(t.slug,t.mode)}">${esc(t.label)} ↗</a>`).join('');}
function courseCard(a,rich=false){const n=String(a.number).padStart(2,'0'),link=`<a class="course-card" href="/read/${n}"><span class="directory-number">${n}</span><h3>${esc(a.title)}</h3><span class="directory-arrow" aria-hidden="true">→</span></a>`;return rich?`<article class="course-entry" id="lesson-${n}">${link}<p class="course-question">${esc(lessonEntries[a.number]?.question||'')}</p><nav class="course-experiments" aria-label="第${n}讲相关实验">${targetLinks(a.number)}</nav></article>`:link;}
function courseDirectory(rich=false){return `<div class="course-grid ${rich?'course-grid-rich':''}" aria-label="按讲次排序的课程目录">${[catalog.articles.slice(0,8),catalog.articles.slice(8)].map(group=>`<div class="course-column"><div class="course-column-head" aria-hidden="true"><span>讲次</span><span>文章${rich?'与实验':''}</span></div>${group.map(a=>courseCard(a,rich)).join('')}</div>`).join('')}</div>`;}
function heroArt(){return`<div class="hero-art"><svg viewBox="0 0 500 400" role="img" aria-label="从轨道、光线到测量，构成彼此关联的知识地图"><defs><radialGradient id="g"><stop offset="0" stop-color="#ebc77e" stop-opacity=".32"/><stop offset="1" stop-color="#ebc77e" stop-opacity="0"/></radialGradient></defs><circle cx="250" cy="190" r="145" fill="url(#g)"/><g fill="none" stroke="#335265"><ellipse cx="250" cy="190" rx="190" ry="78" transform="rotate(-25 250 190)"/><ellipse cx="250" cy="190" rx="165" ry="125" transform="rotate(40 250 190)"/><circle cx="250" cy="190" r="85"/><path d="M80 305 L210 100 L415 195 Z" stroke-dasharray="3 8"/></g><g fill="#71c8c7"><circle cx="80" cy="305" r="4"/><circle cx="210" cy="100" r="7"/><circle cx="415" cy="195" r="6"/><circle cx="145" cy="164" r="12"/></g><circle cx="250" cy="190" r="28" fill="#ebc77e"/><circle cx="326" cy="153" r="9" fill="#a5bcc7"/><g font-size="12" fill="#b9cbd8" font-family="Microsoft YaHei"><text x="46" y="330">几何</text><text x="183" y="81">观测</text><text x="426" y="195">测量</text><text x="249" y="257">一个问题，点亮一片区域</text></g></svg><p class="hero-caption">知识关系示意 · 天体与距离未按比例</p></div>`;}
function home(){navigation('home');document.title='天文学实验室 · 课程与实验';app.innerHTML=`<section class="hero course-hero"><div class="hero-copy"><p class="eyebrow">从试卷讲起的天文学知识入门</p><h1>从一道题，<br>走向<em>一片星空。</em></h1><p>先改变一个条件，再看现象如何变化。把月相、星点、轨道与读数接回完整文章中的关系。</p><div class="hero-actions"><a class="primary-link" href="#questions">从一个问题进入 ↓</a><a class="secondary-link" href="/courses">按十六讲阅读 →</a></div><p class="hero-use">适合社团分享，也适合独自慢慢读。实验可以自由切换，文章保留完整展开。</p></div>${heroArt()}</section><section id="questions" class="question-directory"><div class="section-header"><h2>现在想看懂什么？</h2><p>选择主题，或直接进入一个实验。</p></div><div class="theme-filter" role="group" aria-label="按主题查看实验"><button data-filter="all" aria-pressed="true">全部</button>${topics.map(t=>`<button data-filter="${t.key}" aria-pressed="false">${t.name}</button>`).join('')}<span class="theme-count" data-theme-count aria-live="polite">11个实验</span></div><div class="home-lab-grid">${labs.map(card).join('')}</div></section><section class="home-course-directory"><div class="section-header"><h2>也可以，从文章开始。</h2><a href="/courses">课程问题与相关实验 →</a></div>${courseDirectory()}</section>`;const filter=app.querySelector('.theme-filter'),click=e=>{const button=e.target.closest('[data-filter]');if(!button)return;const key=button.dataset.filter;filter.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));let count=0;app.querySelectorAll('.experiment-row').forEach(row=>{row.hidden=key!=='all'&&row.dataset.topic!==key;if(!row.hidden)count++;});app.querySelector('[data-theme-count]').textContent=count+'个实验';};filter.addEventListener('click',click);cleanup=()=>filter.removeEventListener('click',click);}
function courses(){navigation('courses');document.title='16讲全文 · 天文学实验室';app.innerHTML=`<div class="course-index-heading"><p class="eyebrow">按讲次，从一个问题展开</p><h1>十六讲，<br>一张逐步展开的地图。</h1><p class="page-lead">每篇保留完整论述、公式、图版和来源。可以读完一篇，也可以先做相关实验，再沿着现象回到文章。</p></div><div class="course-shortcuts" aria-label="课程主题">${topics.map(t=>`<a href="#lesson-${{space:'01',light:'08',stars:'11',measure:'15'}[t.key]}">${t.name}<small>${t.range}</small></a>`).join('')}</div>${courseDirectory(true)}<div class="lab-reading-links"><a href="/#questions">从主题与问题挑选实验 →</a><a href="/materials">查看图版与素材 →</a></div>`;}
async function read(number,scope){
 navigation('courses');const a=catalog.articles.find(x=>x.number===number);
 if(!a)throw Error('没有这篇文章。');
 document.title=a.title+' · 天文学实验室';
 app.innerHTML='<p class="loading" role="status">正在载入完整文章…</p>';
 const html=await loadArticleHTML(`/reading/L${String(number).padStart(2,'0')}.html`,{signal:scope.signal});
 if(!scope.isCurrent())return;
 const body=parseArticleHTML(html),links=targetsFor(number);
 app.innerHTML=`<div class="breadcrumb"><a href="/courses">16讲全文</a> / 第${String(number).padStart(2,'0')}讲</div><div class="lab-reading-links">${links.map(l=>`<a href="${experimentURL(l.slug,l.mode)}">${esc(l.label)} ↗</a>`).join('')}<a href="/materials?lecture=${number}">本讲素材与署名 →</a></div><div class="reading-layout"><aside class="reading-sidebar"><p>课程目录</p>${catalog.articles.map(x=>`<a class="${x.number===number?'active':''}" href="/read/${String(x.number).padStart(2,'0')}">${String(x.number).padStart(2,'0')} · ${esc(x.title)}</a>`).join('')}</aside><article class="article-body">${body}</article></div><div class="lab-reading-links">${number>1?`<a href="/read/${String(number-1).padStart(2,'0')}">← 上一讲</a>`:''}${number<16?`<a href="/read/${String(number+1).padStart(2,'0')}">下一讲 →</a>`:''}</div>`;
 const article=app.querySelector('.article-body'),groups=new Map();
 for(const path of pathsForLesson(number)){
  const anchor=[...article.querySelectorAll('[id]')].find(node=>node.id===path.anchor);
  if(!anchor)continue;
  const insertion=anchor.matches('a')?anchor.closest('p')||anchor:anchor;
  if(!groups.has(insertion))groups.set(insertion,[]);
  groups.get(insertion).push(path);
 }
 for(const [anchor,paths]of groups){
  const nav=document.createElement('nav');nav.className='paragraph-experiments lab-reading-links';nav.setAttribute('aria-label','这一段的相关实验');
  for(const path of paths){
   const link=document.createElement('a'),url=new URL(experimentURL(path.slug,path.mode),location.origin);
   url.searchParams.set('from',path.id);const ui=new URLSearchParams(location.search).get('ui');if(ui)url.searchParams.set('ui',ui);link.href=url.pathname+url.search;link.dataset.learningPath=path.id;link.textContent=path.label+' ↗';nav.append(link);
  }
  anchor.after(nav);
 }
}
function materials(){navigation('materials');document.title='素材库 · 天文学实验室';app.innerHTML=`<h1>让每幅图，都有来处。</h1><p class="page-lead">观测照片、赋色图、统计图与计算示意分别标注。点击图片查看大图，原文件与源页面可直接打开；署名和许可应随素材保留。</p><div class="asset-tools"><input id="asset-search" type="search" placeholder="搜索天体、图名、机构或表示类型" aria-label="搜索素材"><select id="asset-lecture" aria-label="按讲次筛选"><option value="">全部讲次</option>${catalog.articles.map(a=>`<option value="${a.number}">第${String(a.number).padStart(2,'0')}讲</option>`).join('')}</select><span class="asset-count" id="asset-count"></span></div><div class="assets-grid" id="assets-grid"></div><dialog class="lightbox" id="lightbox"><div class="lightbox-head"><span id="lightbox-title"></span><button id="close-lightbox">关闭 ×</button></div><img id="lightbox-image"><p id="lightbox-credit"></p></dialog>`;
 const search=document.getElementById('asset-search'),select=document.getElementById('asset-lecture');const params=new URL(location.href).searchParams,requested=params.get('lecture')||params.get('lesson');select.value=requested?String(Number(requested)):'';const draw=()=>{const q=search.value.toLowerCase(),number=select.value;const rows=catalog.assets.filter(a=>(!number||(a.used_by||'').includes(`L${String(number).padStart(2,'0')}`))&&(!q||[a.title,a.creator,a.representation_type,a.credit].join(' ').toLowerCase().includes(q)));document.getElementById('asset-count').textContent=`${rows.length} 项素材`;document.getElementById('assets-grid').innerHTML=rows.map(a=>`<article class="asset-card"><img class="asset-image" loading="lazy" src="/${esc(a.local_path)}" alt="${esc(a.title)}" data-asset="${esc(a.asset_id)}"><div class="asset-body"><span class="status-pill">${esc(a.representation_type)}</span><h3>${esc(a.title)}</h3><p>${esc(a.credit)}</p><p>许可：${esc(a.permission_or_license)}</p><p>处理：${esc(a.modifications)}</p><div class="asset-links"><a href="/${esc(a.local_path)}" target="_blank" rel="noopener">原文件 ↗</a><a href="${esc(a.source_page)}" target="_blank" rel="noopener">原始来源 ↗</a></div></div></article>`).join('');};search.oninput=select.onchange=draw;draw();document.getElementById('assets-grid').onclick=e=>{const image=e.target.closest('[data-asset]');if(!image)return;const a=catalog.assets.find(x=>x.asset_id===image.dataset.asset);document.getElementById('lightbox-title').textContent=a.title;document.getElementById('lightbox-image').src='/'+a.local_path;document.getElementById('lightbox-image').alt=a.title;document.getElementById('lightbox-credit').textContent=a.credit+' · '+a.representation_type;document.getElementById('lightbox').showModal();};document.getElementById('close-lightbox').onclick=()=>document.getElementById('lightbox').close();}
async function sources(scope){
 navigation('sources');document.title='来源与模型 · 天文学实验室';
 app.innerHTML='<p class="loading" role="status">正在载入来源与核查记录…</p>';
 const [status,integration]=await Promise.all([
  loadJSON('/status.json',{signal:scope.signal,validate:validStatus}),
  loadJSON('/data/ui-integration-status.json',{signal:scope.signal,validate:validIntegration})
 ]);
 if(!scope.isCurrent())return;
 const currentStatus='<p class="current-release-status">2026-10-04 已独立公开。第三方许可待核，真人科学审校与真实试讲待进行；本轮本地代码更新尚未部署。<a href="/sources/release-status.md" target="_blank" rel="noopener">当前发布状态与待核清单 ↗</a> · <a href="/sources/experience-review.md" target="_blank" rel="noopener">本轮计划与实际验收 ↗</a></p>';
 app.innerHTML=`<h1>看见结果，也看见依据。</h1><p class="page-lead">网页可运行、科学来源已读取、画面已查看、真人已审校，是四种不同证据。各实验室列出所用坐标、公式、简化和资料范围；更改后需重新检查相应版本。</p><table class="source-table"><tr><th>项目</th><th>当前记录</th><th>含义</th></tr><tr><td>此前数学与工程记录</td><td>${esc(statusLabel(status.state))} · ${status.count}项</td><td>此前版本的记录；界面改动另行验证</td></tr><tr><td>此前页面与接口整合</td><td>${esc(statusLabel(integration.state))} · ${integration.count}项局部检查</td><td>此前版本报告：${esc(integration.scope)}；不代表本轮改动后的结果。</td></tr><tr><td>此前版本模型视觉复核</td><td>${esc(statusLabel(integration.model_visual_review))}</td><td>只代表此前版本实际查看过的规定视图；本轮界面需另行查看。</td></tr><tr><td>真人科学审校</td><td>待进行</td><td>尚未取得真人审校记录</td></tr><tr><td>真实试讲／教材对照</td><td>待进行 / 待进行</td><td>不从工程或模型检查升级</td></tr></table><div class="section-header"><h2>各实验室的来源与限定</h2></div><div class="sources-grid"><div class="source-directory-head" aria-hidden="true"><span>实验室</span><span>内容</span><span>资料</span></div>${labs.map(l=>`<section class="source-card source-directory-row"><div class="source-directory-title"><span class="directory-number">第${l.tag}讲</span><h2><a href="${l.url||'/lab/'+l.slug}">${l.title}</a></h2></div><p>${l.text}</p><div class="source-directory-actions"><a href="${l.url||'/lab/'+l.slug}">进入实验 →</a><a href="${l.url?l.url+'SOURCES.md':'/sources/'+l.slug+'.md'}" target="_blank" rel="noopener">来源与限定 ↗</a></div></section>`).join('')}</div><div class="section-header"><h2>课程文章来源索引</h2></div><div class="source-index"><p>课程原有核验状态保留。素材许可与第三方权益逐项说明，公开再分发边界见各项来源记录与第三方清单。</p>${['first4','batch-A','batch-B','batch-C','batch-D'].map(s=>`<a href="/reading/linked/assets/v02-${s}-SOURCES.html">${s==='first4'?'01—04':s==='batch-A'?'05—07':s==='batch-B'?'08—10':s==='batch-C'?'11—13':'14—16'} 来源记录 ↗</a>`).join('')}<a href="/reading/linked/assets/v02-reference/SOURCES-pro-01-04.html">Pro原始来源编号 ↗</a></div>`;
 app.querySelector('.page-lead').insertAdjacentHTML('afterend',currentStatus);
}
async function lab(slug,scope,context){
 const l=labs.find(l=>l.slug===slug);navigation();if(!l)throw Error('没有这个实验室。');
 document.title=l.title+' · 天文学实验室';
 app.innerHTML=`<div class="breadcrumb"><a href="/">知识地图</a> / 第${l.tag}讲</div><h1>${l.title}</h1><p class="page-lead">${l.text}</p><div id="lab-mount"><p class="loading" role="status">正在载入实验…</p></div><div class="lab-reading-links">${l.lessons.map(n=>`<a href="/read/${String(n).padStart(2,'0')}">第${String(n).padStart(2,'0')}讲 · 完整文章 ↗</a>`).join('')}<a href="/sources/${slug}.md" target="_blank" rel="noopener">来源与模型范围 ↗</a></div>`;
 const module=await import(`/modules/${slug}.js`);if(!scope.isCurrent())return;
 const host=document.getElementById('lab-mount');host.innerHTML='';
 const requested=context.url.searchParams.get('mode'),mode=confirmedModes[slug]?.includes(requested)?requested:undefined;
 const result=await module.mount(host,{mode});
 const disposeModel=typeof result==='function'?result:()=>result?.dispose?.();
 if(!scope.isCurrent()){disposeModel();return;}
 let unbind=null;cleanup=()=>{unbind?.();disposeModel();};
 context.experiment={slug,root:host};
 enterMode(slug,mode,host);
 await restoreExperiment(slug,host,{mode,entryId:context.id});
 if(!scope.isCurrent())return;
 unbind=bindExperimentState(slug,host,{entryId:context.id});
}

function saveActive(){
 const context=activePage;if(!context)return;
 if(context.readingRoot&&!context.restoration?.isPending())readingStore.save(context.id,context.href,captureReadingPosition(context.readingRoot));
 if(context.experiment)captureExperiment(context.experiment.slug,context.experiment.root,{entryId:context.id});
}

function showFailure(error,{title='页面暂时无法载入',path=location.pathname}={}){
 cleanup?.();cleanup=null;app.dataset.page='error';app.removeAttribute('aria-busy');
 if(activePage){activePage.readingRoot=null;activePage.experiment=null;}
 const articleLinks=path.startsWith('/lab/')?(labs.find(l=>l.slug===path.split('/')[2])?.lessons||[]).map(n=>`<a href="/read/${String(n).padStart(2,'0')}">先读第${String(n).padStart(2,'0')}讲 →</a>`).join(''):'';
 app.innerHTML=`<section class="load-error" role="alert"><h1>${esc(title)}</h1><p class="error">${esc(error.message||'连接暂时中断')}。请重试，或从导航继续浏览。</p><div class="lab-reading-links"><button type="button" data-retry>重试</button><a href="/courses">课程目录 →</a><a href="/">返回首页 →</a>${articleLinks}</div></section>`;
 app.querySelector('[data-retry]').addEventListener('click',()=>{void route('retry');});
}

async function route(kind='push',{skipOutgoingSave=false}={}){
 if(!skipOutgoingSave)saveActive();const old=activePage;activePage=null;old?.restoration?.cancel();cleanup?.();cleanup=null;
 const scope=requests.begin(),url=new URL(location.href),path=url.pathname;
 const context={id:ensureHistoryEntry(window),href:routeAddress(url),url,kind};activePage=context;
 try{
  prepareEditorial();navigation(path.startsWith('/read/')||path==='/courses'?'courses':path==='/'?'home':path.slice(1));
  app.dataset.page='loading';app.setAttribute('aria-busy','true');
  app.innerHTML='<p class="loading" role="status">正在载入页面…</p>';
  // Previous scroll belongs to the outgoing history entry, before this reset.
  window.scrollTo({left:0,top:0,behavior:'instant'});
  if(!catalog&&path!=='/sources'&&!path.startsWith('/lab/')){
   const loaded=await loadJSON('/data/catalog.json',{signal:scope.signal,validate:validCatalog});
   if(!scope.isCurrent())return;
   catalog={...loaded,articles:[...loaded.articles].sort((a,b)=>a.number-b.number)};
  }
  app.dataset.page=path==='/'?'home':path==='/courses'?'courses':path.startsWith('/read/')?'reading':path.startsWith('/lab/')?'lab':path.slice(1);
  if(path==='/')home();
  else if(path==='/courses')courses();
  else if(path==='/materials')materials();
  else if(path==='/sources')await sources(scope);
  else if(/^\/read\/\d{2}$/.test(path))await read(Number(path.slice(-2)),scope);
  else if(/^\/lab\/[a-z-]+$/.test(path))await lab(path.split('/')[2],scope,context);
  else throw Error('找不到这个页面');
  if(!scope.isCurrent())return;
  if(document.body.classList.contains('editorial')){
   const previousCleanup=cleanup,editorialCleanup=applyEditorial(app,catalog);
   cleanup=()=>{editorialCleanup?.();previousCleanup?.();};
  }
  app.removeAttribute('aria-busy');
  if(app.dataset.page==='reading'){
   const root=app.querySelector('.article-body');indexReadingBlocks(root);context.readingRoot=root;
   const target=restorationTarget({kind,snapshot:readingStore.get(context.id,context.href),hash:url.hash});
   context.restoration=restoreReadingPosition(root,window,target,()=>{if(activePage===context)saveActive();});
  }else if(url.hash){
   requestAnimationFrame(()=>{if(scope.isCurrent())document.getElementById(decodeAnchor(url.hash))?.scrollIntoView();});
  }
 }catch(error){
  if(!scope.isCurrent()||error.name==='AbortError')return;
  const title=!catalog&&path!=='/sources'&&!path.startsWith('/lab/')?'课程目录暂时无法载入':path.startsWith('/read/')?'文章暂时无法载入':path==='/sources'?'来源记录暂时无法载入':path.startsWith('/lab/')?'实验暂时无法载入':'页面暂时无法载入';
  showFailure(error,{title,path});
 }finally{if(scope.isCurrent())app.removeAttribute('aria-busy');}
}

function isAppPath(path){return['/','/courses','/materials','/sources'].includes(path)||/^\/(read\/\d{2}|lab\/[a-z-]+)$/.test(path);}

document.addEventListener('click',event=>{
 const a=event.target.closest('a');
 if(!a||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||a.target||a.hasAttribute('download'))return;
 const url=new URL(a.href,location.href);if(url.origin!==location.origin)return;
 saveActive();
 const requestedUI=new URLSearchParams(location.search).get('ui');
 if(!isAppPath(url.pathname)){
  if(url.pathname.startsWith('/labs/')&&requestedUI&&!url.searchParams.has('ui')){event.preventDefault();url.searchParams.set('ui',requestedUI);location.assign(url.href);}
  return;
 }
 event.preventDefault();
 if(requestedUI&&!url.searchParams.has('ui'))url.searchParams.set('ui',requestedUI);
 document.querySelector('.nav-dropdown')?.removeAttribute('open');
 // In-page anchors get their own history identity too. Reloading the article
 // uses the same normal route; a later Back restores the earlier paragraph.
 history.pushState(createHistoryState(),'',url);void route('push');
});
let saveTimer;
window.addEventListener('scroll',()=>{clearTimeout(saveTimer);saveTimer=setTimeout(saveActive,100);},{passive:true});
window.addEventListener('pagehide',saveActive);
window.addEventListener('popstate',()=>{void route('pop');});
window.addEventListener('pageshow',event=>{if(event.persisted)void route('initial',{skipOutgoingSave:true});});
void route('initial').catch(error=>showFailure(error));
