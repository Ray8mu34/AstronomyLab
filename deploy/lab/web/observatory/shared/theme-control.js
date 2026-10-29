import './theme.js';

export function mountThemeControl(container){
 const doc=container.ownerDocument,win=doc.defaultView,theme=win.AstronomyLabTheme;
 if(!theme)return()=>{};
 const button=doc.createElement('button');button.type='button';button.className='al-button al-theme-toggle';button.dataset.themeToggle='';
 const sync=()=>{const target=theme.get()==='dark'?'白天':'黑夜';button.textContent=target;button.setAttribute('aria-label',`切换到${target}模式`);};
 const click=()=>theme.set(theme.get()==='dark'?'light':'dark');
 button.addEventListener('click',click);win.addEventListener('al-theme-change',sync);sync();container.append(button);
 return()=>{button.removeEventListener('click',click);win.removeEventListener('al-theme-change',sync);button.remove();};
}
