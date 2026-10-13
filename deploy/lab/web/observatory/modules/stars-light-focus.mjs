// 仅供组C两个模块使用；移动现有工作台，保留原控件和计算，离开时清理。
export function attachFocus(root,{workbench,title,redraw}){
 const dialog=document.createElement('dialog');dialog.className='c-focus';
 dialog.innerHTML='<div class="c-focus-head"><h2 data-focus-title></h2><button data-focus-close>返回页面 ×</button></div><p class="c-focus-note">参数、比较基线与读数同步。详细设置可展开；Esc 返回。</p><div data-focus-body></div>';
 root.append(dialog);const button=root.querySelector('[data-focus-open]');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');let slot=null,returnTo=null,scroll=0,disposed=false,frame=0;
 const restore=()=>{if(slot){slot.replaceWith(workbench);slot=null;}if(!disposed)redraw();};
 const close=()=>{restore();dialog.close();button.setAttribute('aria-expanded','false');if(!disposed){scrollTo(0,scroll);returnTo?.focus({preventScroll:true});frame=requestAnimationFrame(()=>{if(!disposed)redraw();});}};
 const open=()=>{returnTo=document.activeElement;scroll=scrollY;slot=document.createComment('C focus return');workbench.before(slot);dialog.querySelector('[data-focus-body]').append(workbench);dialog.querySelector('[data-focus-title]').textContent=title();dialog.setAttribute('aria-label',title());dialog.showModal();button.setAttribute('aria-expanded','true');dialog.querySelector('[data-focus-close]').focus();redraw();};
 const cancel=e=>{e.preventDefault();close();},closed=()=>{if(slot)restore();};
 button.addEventListener('click',open);dialog.querySelector('[data-focus-close]').addEventListener('click',close);dialog.addEventListener('cancel',cancel);dialog.addEventListener('close',closed);
 return()=>{disposed=true;cancelAnimationFrame(frame);button.removeEventListener('click',open);dialog.querySelector('[data-focus-close]').removeEventListener('click',close);dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('close',closed);restore();dialog.close();dialog.remove();};
}
