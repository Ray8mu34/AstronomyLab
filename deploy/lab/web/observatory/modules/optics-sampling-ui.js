// Sampling presentation only; all inputs, images and focus remain the original owners.
export function attachSamplingUI(root,{redraw}){
 const q=s=>root.querySelector(s),slots=new Map();let active=false,ready=false,disposed=false;
 const style=document.createElement('link');style.rel='stylesheet';style.href='/modules/optics-sampling-ui.css';root.append(style);
 const shell=document.createElement('section');shell.className='sampling-shell';shell.hidden=true;
 shell.innerHTML='<header class="sampling-header"><a href="/">← Lab</a><h1>放大与采样</h1><span>连续光场 → 像素积分</span><details class="sampling-modes"><summary>放大采样 ⌄</summary><div data-sampling-modes></div></details></header><div class="sampling-body"></div><details class="sampling-info"><summary>读图、模型与来源</summary><div><button type="button" data-sampling-close>关闭说明 ×</button><div data-sampling-info></div><a href="/sources/optics.md" target="_blank" rel="noopener">原模型与来源 ↗</a></div></details>';
 q('.optics-pilot').append(shell);const s=x=>shell.querySelector(x);
 const toolbar=document.createElement('div');toolbar.className='sampling-toolbar';toolbar.innerHTML='<details class="sampling-presets"><summary>采样预设与复位</summary><div data-sampling-presets></div></details>';
 const note=document.createElement('p');note.className='sampling-note';note.textContent='各图分别自动归一，仅比较形状；角宽分别标注，不能按屏幕亮度比较通量。';
 const closeButton=document.createElement('button');closeButton.type='button';closeButton.dataset.samplingClose='';closeButton.textContent='关闭详细参数 ×';
 function move(node,host){if(!node||slots.has(node))return;const slot=document.createComment('sampling return');node.before(slot);slots.set(node,slot);host.append(node);}
 function suspend(){if(!active)return;active=false;for(const[node,slot]of[...slots].reverse())slot.replaceWith(node);slots.clear();toolbar.remove();note.remove();closeButton.remove();q('.optics-pilot')?.classList.remove('sampling-active');root.classList.remove('sampling-active');document.body.classList.remove('sampling-observing');shell.hidden=true;}
 function setMode(task){if(!ready||disposed)return;if(task!=='sampling'){suspend();return;}if(active)return;active=true;root.classList.add('sampling-active');q('.optics-pilot').classList.add('sampling-active');document.body.classList.add('sampling-observing');shell.hidden=false;
  move(q('.optics-workspace'),s('.sampling-body'));move(q('.optics-tasks'),s('[data-sampling-modes]'));
  for(const node of[q('.optics-guide'),q('.optics-explanation'),q('[data-mode-boundary]')])move(node,s('[data-sampling-info]'));
  move(q('[data-primary-controls]'),q('.optics-observation'));q('.optics-observation').prepend(q('[data-primary-controls]'));q('.optics-image-view').append(note);
  q('.optics-workspace>.optics-controls').prepend(toolbar);move(q('.optics-presets'),toolbar.querySelector('[data-sampling-presets]'));move(q('[data-profile-toggle]'),toolbar);q('[data-parameters]').append(closeButton);
 }
 function close(d){if(d?.open){d.open=false;d.querySelector('summary')?.focus({preventScroll:true});}}
 const click=e=>{if(e.target.closest('[data-sampling-close]'))close(e.target.closest('details'));if(e.target.closest('button[data-task]'))close(s('.sampling-modes'));};
 const keydown=e=>{if(e.key!=='Escape'||!active||q('dialog[open]'))return;const list=root.querySelectorAll('.sampling-shell details[open],.optics-pilot.sampling-active details[open]');if(list.length){e.preventDefault();close(list[list.length-1]);}};
 root.addEventListener('click',click);root.addEventListener('keydown',keydown);const frame=requestAnimationFrame(()=>{if(!disposed){ready=true;redraw();}});
 return{setMode,beforeTask:suspend,dispose(){disposed=true;cancelAnimationFrame(frame);suspend();root.removeEventListener('click',click);root.removeEventListener('keydown',keydown);shell.remove();style.remove();}};
}
