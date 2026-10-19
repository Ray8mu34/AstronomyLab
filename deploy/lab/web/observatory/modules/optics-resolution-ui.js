// Only the presentation of the existing PSF and detector task changes here.
export function attachResolutionUI(root,{redraw}){
 const q=s=>root.querySelector(s),slots=new Map();let ready=false,active=false,disposed=false;
 const link=document.createElement('link');link.rel='stylesheet';link.href='/modules/optics-resolution-ui.css';root.append(link);
 const shell=document.createElement('section');shell.className='resolution-shell';shell.hidden=true;
 shell.innerHTML='<header class="resolution-header"><a href="/">← Lab</a><h1>收光与分辨</h1><details class="resolution-modes"><summary>模式 ⌄</summary><div data-resolution-modes></div></details></header><div data-resolution-body></div><details class="resolution-info"><summary>读图、光学模型与来源</summary><div data-resolution-info><button type="button" data-resolution-close>关闭说明 ×</button></div></details>';q('.optics-pilot').append(shell);
 const s=x=>shell.querySelector(x),tools=document.createElement('div');tools.className='resolution-tools';tools.innerHTML='<details class="resolution-comparison"><summary>比较像素积分</summary><p>比较同一双星的连续像与像素积分像。两图同步响应参数，各自标注角宽并归一灰度。</p><button type="button" data-resolution-close>结束积分比较 ×</button></details><details class="resolution-presets"><summary>衍射 / 大气预设与复位</summary><div data-resolution-presets></div></details>';
 const note=document.createElement('p');note.className='resolution-note';note.innerHTML='<span class="resolution-short-note">灰度归一只比形状；收光另看面积。</span><span class="resolution-full-note">灰度自动归一以比较形状；收光量见面积读数，分辨尺度见瑞利角。</span>';
 const identity=document.createElement('p');identity.className='resolution-identity';
 const closeButton=document.createElement('button');closeButton.type='button';closeButton.dataset.resolutionClose='';closeButton.textContent='关闭详细参数 ×';
 function move(n,h){if(!n||slots.has(n))return;const p=document.createComment('resolution return');n.before(p);slots.set(n,p);h.append(n);}
 function suspend(){if(!active)return;active=false;for(const[n,p]of[...slots].reverse())p.replaceWith(n);slots.clear();tools.remove();note.remove();identity.remove();closeButton.remove();shell.hidden=true;q('.optics-pilot').classList.remove('resolution-active');root.classList.remove('resolution-active');document.body.classList.remove('resolution-observing');}
 function setMode(task){if(!ready||disposed)return;if(task!=='resolution'){suspend();return;}if(active)return;active=true;shell.hidden=false;root.classList.add('resolution-active');q('.optics-pilot').classList.add('resolution-active');document.body.classList.add('resolution-observing');
  move(q('.optics-workspace'),s('[data-resolution-body]'));move(q('.optics-tasks'),s('[data-resolution-modes]'));
  for(const n of[q('.optics-guide'),q('.optics-explanation'),q('[data-mode-boundary]')])move(n,s('[data-resolution-info]'));
  move(q('[data-primary-controls]'),q('.optics-observation'));q('.optics-observation').append(q('[data-primary-controls]'));q('.optics-observation').append(identity);
  q('.optics-image-view').append(note);q('.optics-workspace>.optics-controls').prepend(tools);move(q('.optics-presets'),tools.querySelector('[data-resolution-presets]'));move(q('[data-profile-toggle]'),tools);q('[data-parameters]').append(closeButton);
  move(q('.optics-profile-view'),q('.optics-workspace'));q('.optics-workspace').append(q('.optics-profile-view'));
 }
 function render({state}){if(!active)return;identity.textContent=`当前 ${state.type==='refractor'?'折射式':state.type==='newtonian'?'牛顿式':'SCT'} · ${state.wavelength} nm · 等亮双星 ${state.separation.toFixed(1)}″ · 像面偏移 ${state.focus.toFixed(3)} mm`;q('.optics-pilot').dataset.resolutionCompare=String(tools.querySelector('.resolution-comparison').open);q('[data-image-title]').textContent=tools.querySelector('.resolution-comparison').open?'同一双星 · 连续像 / 积分像素':state.view==='eyepiece'?'等亮双星 · 目镜显示':'等亮双星 · 连续波动像';}
 function close(d){if(!d?.open)return;d.open=false;d.querySelector('summary')?.focus({preventScroll:true});if(q('.optics-image-view').getBoundingClientRect().top<0)q('.optics-image-view').scrollIntoView({block:'start'});}
 const click=e=>{if(e.target.closest('[data-resolution-close]'))close(e.target.closest('details'));if(e.target.closest('button[data-task]'))close(s('.resolution-modes'));};
 const key=e=>{if(e.key!=='Escape'||!active||q('dialog[open]'))return;const list=shell.querySelectorAll('details[open]');if(list.length){e.preventDefault();close(list[list.length-1]);}};
 const focus=e=>{if(active&&!q('dialog[open]')&&['aperture','seeing'].includes(e.target.dataset.key)&&q('.optics-image-view').getBoundingClientRect().top<0)q('.optics-image-view').scrollIntoView({block:'start'});};
 const toggle=e=>{if(active&&e.target===tools.querySelector('.resolution-comparison'))redraw();};
 root.addEventListener('click',click);root.addEventListener('keydown',key);root.addEventListener('focusin',focus);root.addEventListener('toggle',toggle,true);const frame=requestAnimationFrame(()=>{ready=true;if(!disposed)redraw();});
 return{setMode,beforeTask:suspend,get comparing(){return!ready||tools.querySelector('.resolution-comparison').open;},render,dispose(){disposed=true;cancelAnimationFrame(frame);suspend();root.removeEventListener('click',click);root.removeEventListener('keydown',key);root.removeEventListener('focusin',focus);root.removeEventListener('toggle',toggle,true);shell.remove();link.remove();}};
}
