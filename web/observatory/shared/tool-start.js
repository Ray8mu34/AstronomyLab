import {navigation} from './navigation.js';
import {prepareEditorial} from './editorial.js';
import {editorialLegacy} from './editorial-labs.js';
import {initializeLegacyExperiment} from './experiment-state.js';
import {getModeContext} from './mode-context.js';
navigation();
if(location.pathname.includes('solar-system')){prepareEditorial();if(document.body.classList.contains('editorial'))editorialLegacy();let abort,dispose=()=>{};
 const boundary=document.createElement('p');boundary.className='solar-tool-boundary';boundary.dataset.modeBoundary='';document.querySelector('.planet-rail').after(boundary);
 const explain=mode=>{boundary.textContent=getModeContext('solar-system',mode)?.boundary||'';};
 const start=()=>{abort=new AbortController();const signal=abort.signal;initializeLegacyExperiment('solar-system',document.body,{signal,onModeChange:explain}).then(cleanup=>{if(signal.aborted)cleanup();else dispose=cleanup;});};start();window.addEventListener('pagehide',()=>{abort.abort();dispose();});window.addEventListener('pageshow',e=>{if(e.persisted)start();});}
