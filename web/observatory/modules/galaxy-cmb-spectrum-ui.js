// Presentation only: the native module owns every input, plot and saved state.
export function attachCmbSpectrumUI(root,{redraw}){
 const q=s=>root.querySelector(s),slots=new Map();let ready=false,active=false,disposed=false,status='loading',last=null;
 const style=document.createElement('link');style.rel='stylesheet';style.href='/modules/galaxy-cmb-spectrum-ui.css';root.append(style);
 const shell=document.createElement('section');shell.className='firas-shell';shell.hidden=true;shell.setAttribute('aria-label','CMB平均谱观察工作区');
 shell.innerHTML=`<header class="firas-header"><a href="/">← Lab</a><h1>CMB 平均谱</h1><span>FIRAS · Bν</span><details class="firas-modes"><summary>平均谱 ⌄</summary><div data-firas-modes></div></details></header><div class="firas-body"><div class="firas-identity"><span>青点 · 43 行发布谱　／　金线 · 2.725 K 黑体参考</span><span>平均谱，不是所选天空方向的测量</span></div><div class="firas-data-state" role="status" aria-live="polite"></div><div class="firas-measurements"><div data-firas-spectrum></div><div class="firas-frequency"><div data-firas-frequency></div><p data-firas-model></p></div><section class="firas-residual" aria-label="发布残差与一倍标准差"><h2>放大看偏离黑体的部分 <span>发布残差 ±1σ · kJy/sr</span></h2><div data-firas-residual></div></section></div><details class="firas-teaching"><summary>独立温差如何改变谱形？ ⌄</summary><div class="firas-disclosure"><div class="firas-detail-head"><p>教学模型 · 不来自方向图像素，也不改变 FIRAS 点或残差</p><button type="button" data-firas-close>关闭教学谱差 ×</button></div><div data-firas-delta></div><div data-firas-differential></div><div data-firas-presets></div><p data-firas-teaching-read></p></div></details><details class="firas-info"><summary>读图、来源与边界 ⌄</summary><div class="firas-disclosure"><button type="button" data-firas-close>关闭说明 ×</button><div data-firas-info></div></div></details></div>`;
 root.append(shell);const s=x=>shell.querySelector(x);
 function move(node,target){if(!node||slots.has(node))return;const slot=document.createComment('FIRAS return');node.before(slot);slots.set(node,slot);target.append(node);}
 function suspend(){if(!active)return;active=false;for(const[node,slot]of [...slots].reverse())slot.replaceWith(node);slots.clear();s('.firas-reset-note')?.remove();root.classList.remove('firas-active');document.body.classList.remove('firas-observing');shell.hidden=true;}
 function setMode(on){if(!ready||disposed)return;if(!on){suspend();return;}if(active)return;active=true;root.classList.add('firas-active');document.body.classList.add('firas-observing');shell.hidden=false;
  move(q('#galaxy-cmb-spectrum'),s('[data-firas-spectrum]'));
  move(q('[data-key="frequency"]').closest('label'),s('[data-firas-frequency]'));
  move(q('#galaxy-residual').parentElement,s('[data-firas-residual]'));
  move(q('[data-key="delta"]').closest('label'),s('[data-firas-delta]'));
  move(q('#galaxy-differential').parentElement,s('[data-firas-differential]'));
  move(q('#galaxy-cmb-controls .galaxy-presets'),s('[data-firas-presets]'));
  move(q('.galaxy-topics'),s('[data-firas-modes]'));move(q('[data-cmb-views]'),s('[data-firas-modes]'));
  const reset=q('[data-reset]');move(reset,s('[data-firas-modes]'));
  const resetNote=document.createElement('p');resetNote.className='firas-reset-note';resetNote.textContent='重置实验返回银河盘外俯瞰；全部 CMB 参数回到 100 µK、160 GHz。';s('[data-firas-modes]').append(resetNote);
  for(const node of [q('.galaxy-head'),q('#galaxy-metrics'),q('#galaxy-details-cmb > .galaxy-caption'),q('#galaxy-copy').closest('details'),q('.galaxy-pilot > div.galaxy-more'),q('[data-mode-boundary]'),q('#galaxy-feedback')])move(node,s('[data-firas-info]'));
 }
 function render(data=last){if(!data||!active)return;last=data;const {state,result}=data,loaded=status==='ready';
  s('.firas-measurements').hidden=!loaded;s('.firas-teaching').hidden=!loaded;
  const message=s('.firas-data-state');message.hidden=loaded;message.setAttribute('role',status==='failed'?'alert':'status');
  message.textContent=status==='failed'?'FIRAS 发布表未能加载：平均谱和残差暂不可用。黑体模型不能替代真实数据；请重新载入页面，或检查 FIRAS 原表是否可访问。':status==='empty'?'FIRAS 文件未提供可绘制的发布谱：平均谱和残差暂不可用。黑体模型不能替代真实数据，请检查原表并重新载入。':'正在读取 FIRAS 发布表；真实数据到达前不展示替代谱。';
  s('[data-firas-model]').textContent=`${state.frequency} GHz · 黑体参考 ${result.blackbody.toFixed(2)} MJy/sr（非 FIRAS 点读数）`;
  s('[data-firas-teaching-read]').textContent=`${state.frequency} GHz · 教学 ΔT = ${state.delta} µK → 相对谱差 ${result.relativeSpectrumPPM.toFixed(1)} ppm`;
 }
 const close=details=>{if(!details?.open)return;details.open=false;details.querySelector('summary').focus({preventScroll:true});if(details!==s('.firas-modes')&&s('.firas-identity').getBoundingClientRect().top<0)s('.firas-identity').scrollIntoView({block:'start'});};
 const click=e=>{if(e.target.closest('[data-firas-close]'))close(e.target.closest('details'));if(e.target.closest('[data-topic],[data-cmb-view],[data-reset]'))close(s('.firas-modes'));};
 const key=e=>{if(e.key!=='Escape'||!active)return;const open=[...shell.querySelectorAll('details[open]')];if(open.length){e.preventDefault();close(open.at(-1));}};
 root.addEventListener('click',click);root.addEventListener('keydown',key);
 const frame=requestAnimationFrame(()=>{if(disposed)return;ready=true;redraw();});
 return{setMode,render,setDataStatus(value){status=value;render();},dispose(){disposed=true;cancelAnimationFrame(frame);suspend();root.removeEventListener('click',click);root.removeEventListener('keydown',key);shell.remove();style.remove();}};
}
