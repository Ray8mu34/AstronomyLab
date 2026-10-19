// Presentation only: native controls, PSF, focus dialog and mode state keep their original owners.
export function attachOpticsImagingUI(root,{redraw}){
 const q=s=>root.querySelector(s),slots=new Map(),attributes=new Map();let ready=false,active=false,disposed=false,currentState=null;
 const link=document.createElement('link');link.rel='stylesheet';link.href='/modules/optics-imaging-ui.css';root.append(link);
 const shell=document.createElement('section');shell.className='oi-shell';shell.hidden=true;
 shell.innerHTML=`<header class="oi-header"><a href="/">← Lab</a><h1>成像</h1><details class="oi-modes"><summary>成像 · 模式 ⌄</summary><div data-oi-modes></div></details></header>
 <div data-oi-body></div><details class="oi-info"><summary>读图与来源 ⌄</summary><div data-oi-info><button type="button" data-oi-close>关闭说明 ×</button></div></details>`;
 q('.optics-pilot').append(shell);const s=x=>shell.querySelector(x);
 const cause=document.createElement('section');cause.className='oi-cause';cause.setAttribute('aria-label','接收位置与离焦成像的因果参照');
 cause.innerHTML=`<div class="oi-geometry"><svg viewBox="0 0 360 122" role="img" aria-label="近轴会聚示意，青色最佳像面与金色接收面；位移放大">
 <path class="oi-axis" d="M18 61H346"/><path class="oi-rays" d="M22 22L190 61L338 95M22 100L190 61L338 27"/>
 <path class="oi-best" d="M190 30V94"/><path class="oi-actual" data-oi-plane d="M190 24V100"/>
 <text class="oi-best-label" x="190" y="118" text-anchor="middle">最佳像面 · 0</text><text class="oi-actual-label" x="340" y="14" text-anchor="end">金：接收面</text>
 </svg><p>近轴会聚示意 · 离焦位移放大</p></div><div class="oi-focus-control"><div data-oi-primary></div><p class="oi-causal-copy" data-oi-causal></p></div>`;
 const tools=document.createElement('div');tools.className='oi-tools';tools.innerHTML='<div data-oi-profile-action></div><details class="oi-system"><summary>结构与完整光路 · 示意 ⌄</summary><p>长度与离焦位移为教学示意；SCT只表示传播顺序，未按真实曲面追迹。</p><div data-oi-system></div><button type="button" data-oi-close>关闭光路 ×</button></details><div data-oi-parameters></div><div data-oi-reset></div>';
 const identity=document.createElement('p');identity.className='oi-identity';
 const note=document.createElement('p');note.className='oi-display-note';note.textContent='灰度经平方根拉伸并归一，便于比较星点形状；收光量见面积读数。';
 const closeButton=document.createElement('button');closeButton.type='button';closeButton.dataset.oiClose='';closeButton.textContent='关闭详细参数 ×';
 function move(n,h){if(!n||slots.has(n))return;const slot=document.createComment('optics imaging return');n.before(slot);slots.set(n,slot);h.append(n);}
 function attr(n,key,value){if(!attributes.has(n))attributes.set(n,{});const saved=attributes.get(n);if(!(key in saved))saved[key]=n.getAttribute(key);n.setAttribute(key,value);}
 function suspend(){if(!active)return;active=false;for(const[n,p]of[...slots].reverse())p.replaceWith(n);slots.clear();for(const[n,a]of attributes)for(const[k,v]of Object.entries(a))v===null?n.removeAttribute(k):n.setAttribute(k,v);attributes.clear();cause.remove();tools.remove();identity.remove();note.remove();closeButton.remove();shell.hidden=true;q('.optics-pilot').classList.remove('oi-active');root.classList.remove('oi-active');document.body.classList.remove('oi-observing');}
 function setMode(task){if(!ready||disposed)return;if(task!=='imaging'){suspend();return;}if(active)return;active=true;shell.hidden=false;root.classList.add('oi-active');q('.optics-pilot').classList.add('oi-active');document.body.classList.add('oi-observing');
  move(q('.optics-workspace'),s('[data-oi-body]'));move(q('.optics-tasks'),s('[data-oi-modes]'));
  for(const n of[q('.optics-guide'),q('.optics-explanation'),q('[data-mode-boundary]')])move(n,s('[data-oi-info]'));
  q('.optics-observation').append(cause);move(q('[data-primary-controls]'),cause.querySelector('[data-oi-primary]'));
  move(q('.optics-ray-view'),tools.querySelector('[data-oi-system]'));
  move(q('.optics-profile-view'),q('.optics-workspace'));q('.optics-workspace').append(q('.optics-profile-view'));
  q('.optics-workspace').append(tools);move(q('[data-profile-toggle]'),tools.querySelector('[data-oi-profile-action]'));move(q('[data-parameters]'),tools.querySelector('[data-oi-parameters]'));move(q('[data-structure-controls]'),q('[data-secondary-controls]'));move(q('.optics-presets'),tools.querySelector('[data-oi-reset]'));q('[data-parameters]').append(closeButton);
  q('.optics-image-view').append(identity,note);attr(q('[data-image]'),'aria-label','接收面上的等亮双星连续波动像，显示自动归一');
 }
 function render({state}){currentState=state;if(!active)return;
  // Original reset/view handlers re-arrange the same native fields; restore only this mode's presentation slot.
  if(q('[data-structure-controls]').parentElement!==q('[data-secondary-controls]'))q('[data-secondary-controls]').prepend(q('[data-structure-controls]'));
  const type=state.type==='refractor'?'折射式':state.type==='newtonian'?'牛顿式':'SCT';
  identity.textContent=`${type} · ${state.wavelength} nm · 等亮双星 ${state.separation.toFixed(1)}″ · 视宁 ${state.seeing.toFixed(1)}″${state.view==='eyepiece'?' · 目镜显示':''}`;
  const x=190+state.focus/.08*70;cause.querySelector('[data-oi-plane]').setAttribute('d',`M${x} 24V100`);
  cause.querySelector('[data-oi-causal]').textContent=state.focus===0?'接收面与最佳像面重合。有限孔径与视宁仍使星点有宽度。':`接收面在最佳像面${state.focus<0?'前':'后'} ${Math.abs(state.focus).toFixed(3)} mm；离焦改变波前叠加，观察星点扩散与环纹。`;
  q('[data-image-title]').textContent='接收面上的等亮双星';q('[data-image-enlarge]').textContent='专注图像';
  q('[data-focus-title]').textContent='成像 · 专注图像';q('.optics-focus-intro').textContent='保留当前天空角尺度与参数，临时隐藏焦面因果参照。';
 }
 function close(d){if(!d?.open)return;d.open=false;d.querySelector('summary')?.focus({preventScroll:true});if(q('.optics-image-view').getBoundingClientRect().top<0)q('.optics-image-view').scrollIntoView({block:'start'});}
 const click=e=>{if(!active)return;if(e.target.closest('[data-oi-close]'))close(e.target.closest('details'));if(e.target.closest('button[data-task]'))close(s('.oi-modes'));if(currentState)render({state:currentState});};
 const key=e=>{if(e.key!=='Escape'||!active||q('dialog[open]'))return;const list=shell.querySelectorAll('details[open]');if(list.length){e.preventDefault();close(list[list.length-1]);}};
 root.addEventListener('click',click);root.addEventListener('keydown',key);const frame=requestAnimationFrame(()=>{ready=true;if(!disposed)redraw();});
 return{setMode,beforeTask:suspend,get observing(){return active;},render,dispose(){disposed=true;cancelAnimationFrame(frame);suspend();root.removeEventListener('click',click);root.removeEventListener('keydown',key);shell.remove();link.remove();}};
}
