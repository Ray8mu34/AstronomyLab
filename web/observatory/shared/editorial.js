import {labs,topics,experimentURL} from './course-map.js';
import {editorialLab,editorialLegacy} from './editorial-labs.js';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function editorialEnabled(){return new URLSearchParams(location.search).get('ui')!=='classic';}
let originalFooter;
export function prepareEditorial(){
 document.body.classList.toggle('editorial',editorialEnabled());
 const footer=document.querySelector('.site-footer');originalFooter??=footer?.innerHTML;if(footer&&!editorialEnabled())footer.innerHTML=originalFooter;
 if(editorialEnabled()&&!document.getElementById('editorial-style')){const link=document.createElement('link');link.id='editorial-style';link.rel='stylesheet';link.href='/shared/editorial.css';document.head.append(link);}
}
function disclosure(label,node,className=''){const d=document.createElement('details');d.className=className;const summary=document.createElement('summary');summary.textContent=label;d.append(summary,node);return d;}

export function applyEditorial(app,catalog){
 if(!editorialEnabled())return ()=>{};
 const nav=document.querySelector('.global-nav');nav.querySelector('.site-brand>span:first-child')?.remove();
 const map=nav.querySelector('a[href="/"]:not(.site-brand)');if(map)map.textContent='首页';
 const footer=document.querySelector('.site-footer');footer.innerHTML='<span>天文学共同基础</span><a href="/sources">资料与来源</a>';
 if(app.dataset.page==='home'){
  app.innerHTML=`<header class="editorial-intro"><p class="section-kicker">天文学共同基础</p><h1>从近处的月亮，<br>看向远处的宇宙。</h1><p class="intro-deck">十六篇文章，十一个实验。<br>从天体怎样运动，到星光如何成为证据。</p><a class="text-link" href="/read/01">开始阅读 →</a></header><section class="editorial-feature"><a class="feature-image" href="/lab/imaging"><img src="/assets/14/v02/m17-sho.jpg" alt="M17星云的窄带赋色图"></a><div class="feature-copy"><p class="section-kicker">图像与观测 · 第14讲</p><h2><a href="/lab/imaging">星云的颜色，<br>从哪里来？</a></h2><p>同一组观测通道，换一种颜色映射。</p><a class="text-link" href="/lab/imaging">打开图像实验 →</a><a class="feature-reading" href="/read/14">读文章：一张天文照片里，究竟有什么</a></div><p class="feature-credit">M17 · ESA / NASA / J. Hester · <a href="https://esahubble.org/images/heic0305a/" target="_blank" rel="noopener">图像来源</a></p></section><section class="editorial-experiments" id="questions"><div class="editorial-section-title"><h2>实验</h2><span>11</span></div><div class="editorial-topic-tabs" role="group" aria-label="实验主题"><button data-filter="all" aria-pressed="true">全部</button>${topics.map(t=>`<button data-filter="${t.key}" aria-pressed="false">${t.name}</button>`).join('')}</div><div class="editorial-lab-list">${labs.map(l=>`<a class="lab-card experiment-row" data-topic="${l.topic}" href="${experimentURL(l.slug,l.slug==='alignments'?'mars':l.slug==='optics'?'resolution':null)}"><span class="directory-number">${l.tag}</span><h3>${l.title}</h3><span class="directory-arrow" aria-hidden="true">↗</span></a>`).join('')}</div></section><section class="editorial-articles" id="articles"><div class="editorial-section-title"><h2>文章</h2><a href="/courses">完整目录 →</a></div><div class="editorial-article-list">${catalog.articles.map(a=>`<a class="course-card" href="/read/${String(a.number).padStart(2,'0')}"><span class="directory-number">${String(a.number).padStart(2,'0')}</span><h3>${escape(a.title)}</h3></a>`).join('')}</div></section>`;
  app.querySelector('.editorial-feature').after(app.querySelector('.editorial-articles'));
  app.querySelector('.editorial-intro').insertAdjacentHTML('beforeend','<a class="intro-index" href="#articles">十六讲目录 ↓</a>');
  app.querySelector('.editorial-topic-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;app.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));app.querySelectorAll('.experiment-row').forEach(x=>x.hidden=b.dataset.filter!=='all'&&x.dataset.topic!==b.dataset.filter);});
 }
 if(app.dataset.page==='courses'){
  app.querySelector('h1').textContent='十六讲全文';
  app.querySelector('.page-lead').remove();app.querySelector('.eyebrow').textContent='课程目录';
  app.querySelectorAll('.course-question').forEach(p=>p.remove());
  app.querySelectorAll('.course-experiments').forEach(n=>{const slot=document.createComment('experiments');n.before(slot);slot.replaceWith(disclosure('相关实验',n));});
 }
 if(app.dataset.page==='materials'){
  app.querySelector('h1').textContent='图版与素材';app.querySelector('.page-lead').textContent='观测照片、赋色图与计算示意。署名和许可随图保留。';
  const organize=()=>{app.querySelectorAll('.asset-card:not([data-editorial])').forEach(card=>{card.dataset.editorial='true';const body=card.querySelector('.asset-body'),info=document.createElement('div');body.querySelectorAll('p').forEach(p=>info.append(p));body.querySelector('.asset-links').before(disclosure('署名、许可与处理',info));const img=card.querySelector('.asset-image');img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label','放大：'+img.alt);});};organize();const observer=new MutationObserver(organize);observer.observe(app.querySelector('#assets-grid'),{childList:true});const key=e=>{if(e.target.matches('.asset-image')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.click();}};app.addEventListener('keydown',key);return ()=>{observer.disconnect();app.removeEventListener('keydown',key);};
 }
 if(app.dataset.page==='sources'){
  app.querySelector('h1').textContent='来源与模型';app.querySelector('.page-lead').textContent='每个实验的公式、简化条件与原始资料。';
  const table=app.querySelector('.source-table'),slot=document.createComment('evidence');table.before(slot);slot.replaceWith(disclosure('核验记录与待审事项',table,'source-evidence'));
  app.querySelectorAll('.source-directory-row>p').forEach(p=>p.remove());
  const rows=app.querySelectorAll('.source-table tr');rows[2].children[0].textContent='此前页面与接口整合';rows[3].children[0].textContent='此前模型视觉复核';
 }
 if(app.dataset.page==='lab'&&location.pathname!=='/lab/imaging')return editorialLab(app);
 if(app.dataset.page==='reading'){
  const body=app.querySelector('.article-body'),toc=body.querySelector('#TOC');
  const readingNav=body.querySelector('.reading-nav');readingNav?.remove();
  if(toc){toc.querySelector('h2')?.remove();const d=disclosure('本文目录',toc,'article-contents');body.prepend(d);}
  const sidebar=app.querySelector('.reading-sidebar'),sidebarSlot=document.createComment('course contents');sidebar.before(sidebarSlot);sidebarSlot.replaceWith(disclosure('十六讲目录',sidebar,'course-contents'));
  const tools=app.querySelector('.lab-reading-links'),toolsSlot=document.createComment('reader tools');tools.before(toolsSlot);tools.className='reader-experiments';toolsSlot.replaceWith(disclosure('相关实验与图版',tools,'reader-tools'));
  const topTitle=body.querySelector('h1');body.prepend(topTitle);
  if(Intl.Segmenter){const segmenter=new Intl.Segmenter('zh',{granularity:'word'}),text=topTitle.textContent;topTitle.replaceChildren(...[...segmenter.segment(text)].map(({segment})=>{const span=document.createElement('span');span.className='title-word';span.textContent=segment;return span;}));}
  const articleTools=document.createElement('div');articleTools.className='article-tools';topTitle.after(articleTools);
  const articleContents=body.querySelector('.article-contents');if(articleContents){articleContents.querySelector('summary').textContent='目录';articleTools.append(articleContents);}
  const readerTools=app.querySelector('.reader-tools');readerTools.querySelector('summary').textContent='相关实验';articleTools.append(readerTools);
  const crumb=app.querySelector('.breadcrumb');crumb.classList.add('reader-kicker');
  // The scientific title text, all paragraphs, figures, MathML and anchors remain intact.
 }
 if(location.pathname==='/lab/imaging'){
  const pilot=app.querySelector('.imaging-pilot'),head=pilot.querySelector('.imaging-head');
  app.querySelector('.page-lead').remove();app.querySelector(':scope > h1').textContent='天文图像与色彩';
  const assistance=document.createElement('div');assistance.className='imaging-assistance';assistance.append(head);
  const inspector=pilot.querySelector('[data-inspector]');
  const coordinates=inspector.querySelector('.imaging-coordinates'),coordinateSlot=document.createComment('coordinates');coordinates.before(coordinateSlot);coordinateSlot.replaceWith(disclosure('像素坐标与键盘操作',coordinates,'pixel-coordinates'));
  const hint=inspector.querySelector('small');inspector.querySelector('.pixel-coordinates').append(hint);
  assistance.append(inspector.querySelector('.pixel-coordinates'));
  pilot.querySelector('.imaging-mapping').after(inspector);
  inspector.insertAdjacentHTML('beforebegin','<p class="imaging-data-note">M17 拼接边界的黑色区域无观测数据。</p>');
  const quick=pilot.querySelector('.imaging-actions');assistance.append(quick);
  const save=pilot.querySelector('[data-save]');assistance.append(save);
  const help=disclosure('数据、像素与快捷比较',assistance,'imaging-auxiliary');
  pilot.querySelector('.imaging-workbench').after(help);
  const controls=pilot.querySelector('.imaging-controls');controls.querySelector(':scope > h3').remove();
  const compare=pilot.querySelector('.imaging-comparison'),visual=pilot.querySelector('.imaging-visual');
  visual.querySelector('.imaging-mapping').after(compare);
  pilot.querySelector('[data-reference]').textContent='保留左图';
  pilot.querySelector('[data-clear-reference]').textContent='恢复灰度';
  pilot.querySelector('[data-reset]').textContent='重置';
   pilot.querySelector('[data-enlarge]').textContent='放大与调节';
  const toolbarTools=document.createElement('div');toolbarTools.className='imaging-toolbar-tools';
  toolbarTools.append(pilot.querySelector('[data-enlarge]'),pilot.querySelector('[data-reset]'));pilot.querySelector('.imaging-toolbar').append(toolbarTools);
  pilot.querySelector('#imaging-feedback').textContent='';
  const origin=pilot.querySelector('#imaging-origin');origin.classList.add('dataset-caption');assistance.prepend(origin);pilot.querySelector('.imaging-view-head').remove();
  const layoutControls=()=>{
   const c=pilot.querySelector('#imaging-controls'),details=c.querySelector('details');
   details.querySelector('summary').textContent='拉伸、增益与配准';
   const white=c.querySelector('[data-key="white"]')?.closest('.control');
   if(white&&white.parentElement!==details)details.querySelector('summary').after(white);
   const expose=c.querySelector('[data-key="exposure"]')?.closest('.control');
   if(expose){expose.classList.add('exposure-primary');}
  };
  layoutControls();
  const observer=new MutationObserver(()=>{if(pilot.querySelector('#imaging-controls > [data-primary-controls] [data-key="white"]'))layoutControls();const note=pilot.querySelector('.imaging-data-note');note.hidden=window.__lab?.state?.dataset==='teaching';});
  observer.observe(pilot.querySelector('#imaging-controls'),{childList:true,subtree:true});
  // Dialog reuses the existing image/inspector nodes and existing keyboard handlers.
  const adjust=e=>{if(e.target.matches('#imaging-controls > details')&&e.target.open&&!pilot.querySelector('.imaging-focus').open&&innerWidth<701)pilot.querySelector('[data-enlarge]').click();};pilot.addEventListener('toggle',adjust,true);
  return ()=>{observer.disconnect();pilot.removeEventListener('toggle',adjust,true);};
 }
 return ()=>{};
}
