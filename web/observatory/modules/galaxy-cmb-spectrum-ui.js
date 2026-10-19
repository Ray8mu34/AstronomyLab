import {applyPresentation,bindDisclosures} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';

export function attachCmbSpectrumUI(root,{redraw}){
 const q=selector=>root.querySelector(selector),slots=new Map();
 let ready=false,active=false,disposed=false,dataState={status:'loading',rows:0,product:null},last=null,disposeNavigation=null,disposePresentation=null,disposeDisclosures=null;
 const style=document.createElement('link');style.rel='stylesheet';style.href='/modules/galaxy-cmb-spectrum-ui.css';root.append(style);
 const shell=document.createElement('section');shell.className='firas-shell al-surface';shell.hidden=true;shell.setAttribute('aria-label','CMB 平均谱');
 shell.innerHTML=`<div class="firas-heading"><div><p class="firas-kicker" data-firas-identity>COBE / FIRAS</p><h2>宇宙背景，接近怎样的黑体？</h2><p class="firas-intro">选择频率，对照平均谱与放大的残差。</p></div><details class="firas-modes al-disclosure"><summary>切换观察 ⌄</summary><div data-firas-modes></div></details></div>
 <div class="firas-data-state al-status" role="status" aria-live="polite"></div>
 <div class="firas-measurements"><div class="firas-observation">
 <aside class="firas-frequency"><div class="firas-selection-label"><span class="firas-marker-key" aria-hidden="true"></span>比较频率</div><div data-firas-frequency></div><div class="firas-model-read"><span>2.725 K 黑体参考</span><p data-firas-model class="al-number"></p><span class="firas-read-unit">MJy/sr</span></div><p class="firas-control-help">点选谱图，或用方向键每次移动 1 GHz。</p></aside>
 <div class="firas-plate"><figure class="firas-spectrum-figure"><figcaption><span>平均谱</span><span>谱辐射亮度 Bν / MJy sr⁻¹</span></figcaption><div data-firas-spectrum></div></figure><figure class="firas-residual"><figcaption><span>观测 − 黑体</span><span>发布残差 ±1σ / kJy sr⁻¹</span></figcaption><div data-firas-residual></div></figure></div>
 <aside class="firas-published-reading"><h3>邻近发布点</h3><p class="firas-row-frequency al-number" data-firas-row-frequency></p><p class="firas-row-value al-number" data-firas-row-value></p><p class="firas-read-unit">残差 ±1σ · kJy/sr</p><p class="firas-neighbor-note">圆点位于发布频率；虚线表示比较频率。</p><div class="firas-legend"><span><i class="firas-data-key"></i>FIRAS 发布点</span><span><i class="firas-model-key"></i>2.725 K 黑体</span><span><i class="firas-error-key">↕</i>一倍标准差</span></div></aside>
 </div><p class="firas-source-line">数据：NASA LAMBDA · COBE/FIRAS <a href="/data/galaxy/firas_monopole_spec_v1.txt" target="_blank" rel="noopener">发布原表 ↗</a></p></div>
 <details class="firas-teaching al-disclosure"><summary>温差怎样改变谱形？</summary><div class="firas-disclosure"><div class="firas-detail-head"><p>给黑体增加一个温差，比较相对谱差。</p><button class="al-button" type="button" data-firas-close>收起</button></div><div data-firas-delta></div><div data-firas-differential></div><div data-firas-presets class="al-mode-nav"></div><p data-firas-teaching-read class="al-number"></p><p class="al-caption">教学温差与全天方向图独立；FIRAS 发布点保持原值。</p></div></details>
 <details class="firas-info al-disclosure"><summary>读图与来源</summary><div class="firas-disclosure"><button class="al-button" type="button" data-firas-close>收起</button><div class="firas-reading-copy"><p>FIRAS 的发布平均谱由 2.725 K 黑体谱加报告残差组成。上图以 MJy/sr 表示总谱，下图将残差放大，以 kJy/sr 表示；误差条为一倍标准差。</p><p>平均谱描述天空的平均辐射。不同方向的微小起伏由全天方向图呈现。独立教学温差通过黑体公式计算频谱变化。</p><p class="firas-formula al-number">Bν(T) = (2hν³/c²) / (e^(hν/kT) − 1)</p><p>Bν 在约 160 GHz 处达到峰值。按单位波长表示的 Bλ 具有不同的峰值位置。</p><p data-firas-residual-summary></p><p><a href="https://lambda.gsfc.nasa.gov/product/cobe/firas_monopole_spect.html" target="_blank" rel="noopener">NASA LAMBDA · 产品说明 ↗</a> · <a href="/sources/galaxy.md" target="_blank" rel="noopener">模型与来源 ↗</a></p></div></div></details>`;
 root.append(shell);const s=selector=>shell.querySelector(selector);
 function move(node,target){if(!node||slots.has(node))return;const slot=document.createComment('FIRAS return');node.before(slot);slots.set(node,slot);target.append(node);}
 function suspend(){if(!active)return;active=false;disposeNavigation?.();disposeNavigation=null;disposeDisclosures?.();disposeDisclosures=null;disposePresentation?.();disposePresentation=null;for(const [node,slot] of [...slots].reverse())slot.replaceWith(node);slots.clear();root.classList.remove('firas-active');document.body.classList.remove('firas-observing');shell.hidden=true;}
 function setMode(on){
  if(!ready||disposed)return;if(!on){suspend();return;}if(active)return;
  active=true;root.classList.add('firas-active');document.body.classList.add('firas-observing');shell.hidden=false;
  disposePresentation=applyPresentation(shell,{surface:'paper',redraw});disposeDisclosures=bindDisclosures(shell);
  move(q('#galaxy-spectrum'),s('[data-firas-spectrum]'));move(q('#galaxy-residual'),s('[data-firas-residual]'));
  move(q('[data-key="frequency"]').closest('label'),s('[data-firas-frequency]'));
  move(q('[data-key="delta"]').closest('label'),s('[data-firas-delta]'));move(q('#galaxy-differential'),s('[data-firas-differential]'));
  move(q('#galaxy-cmb-controls .galaxy-presets'),s('[data-firas-presets]'));
  s('[data-firas-presets] .galaxy-presets').classList.add('al-mode-nav');
  move(q('.galaxy-topics'),s('[data-firas-modes]'));move(q('[data-cmb-views]'),s('[data-firas-modes]'));move(q('[data-reset]'),s('[data-firas-modes]'));
  for(const node of s('[data-firas-modes]').querySelectorAll('.button-row'))node.classList.add('al-mode-nav');
  disposeNavigation=mountWorkspaceNavigation(shell,{modeNav:s('.firas-modes'),label:'CMB 实验导航'});
  q('[data-key="frequency"]').setAttribute('aria-label','比较频率 / GHz');
  q('[data-key="delta"]').setAttribute('aria-label','教学温差 / µK');
 }
 function render(data=last){
  if(data)last=data;if(!last||!active)return;
  const {state,result,rows=[]}=last,loaded=dataState.status==='ready';
  for(const section of [s('.firas-measurements'),s('.firas-teaching')]){section.style.visibility=loaded?'visible':'hidden';section.inert=!loaded;section.setAttribute('aria-hidden',String(!loaded));}
  s('[data-firas-identity]').textContent=loaded?`COBE / FIRAS · ${dataState.rows} 个观测点`:'COBE / FIRAS';
  const message=s('.firas-data-state');message.hidden=loaded;message.setAttribute('role',dataState.status==='failed'?'alert':'status');
  message.textContent=dataState.status==='failed'?'FIRAS 数据未能加载，平均谱与残差暂不可用。请重新加载页面。':'正在加载 FIRAS 平均谱…';
  s('[data-firas-model]').textContent=result.blackbody.toFixed(2);
  s('[data-firas-teaching-read]').textContent=`${state.frequency} GHz · ΔT = ${state.delta} µK → 相对谱差 ${result.relativeSpectrumPPM.toFixed(1)} ppm`;
  if(loaded&&rows.length){
   const near=rows.reduce((best,row)=>Math.abs(row.frequencyGHz-state.frequency)<Math.abs(best.frequencyGHz-state.frequency)?row:best,rows[0]);
   s('[data-firas-row-frequency]').textContent=`${near.frequencyGHz.toFixed(2)} GHz`;
   s('[data-firas-row-value]').textContent=`${near.residual>0?'+':''}${near.residual} ± ${near.sigma}`;
   const tail=rows.at(-1);s('[data-firas-residual-summary]').textContent=`最高频发布点 ${tail.frequencyGHz.toFixed(2)} GHz，残差 ${tail.residual} ± ${tail.sigma} kJy/sr。`;
  }
 }
 function close(details){if(!details?.open)return;details.open=false;details.querySelector('summary').focus({preventScroll:true});}
 const click=event=>{if(event.target.closest('[data-firas-close]'))close(event.target.closest('details'));if(event.target.closest('[data-topic],[data-cmb-view],[data-reset]'))close(s('.firas-modes'));};
 const toggle=event=>{if(active&&event.target.matches('details'))redraw();};
 root.addEventListener('click',click);shell.addEventListener('toggle',toggle,true);
 let frame=0;const activate=()=>{if(disposed||ready||frame)return;frame=requestAnimationFrame(()=>{frame=0;if(disposed)return;ready=true;redraw();});};style.addEventListener('load',activate,{once:true});if(style.sheet)activate();
 return {setMode,render,setDataStatus(value){dataState=value;render();},dispose(){disposed=true;style.removeEventListener('load',activate);cancelAnimationFrame(frame);suspend();root.removeEventListener('click',click);shell.removeEventListener('toggle',toggle,true);shell.remove();style.remove();}};
}
