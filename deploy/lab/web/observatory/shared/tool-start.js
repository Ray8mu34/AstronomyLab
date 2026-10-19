import {navigation,mountWorkspaceNavigation} from './navigation.js';
import {applyPresentation,bindDisclosures} from './presentation.js';
import {prepareEditorial} from './editorial.js';
import {editorialLegacy} from './editorial-labs.js';
import {initializeLegacyExperiment} from './experiment-state.js';
import {getModeContext} from './mode-context.js';
navigation();
if(location.pathname.includes('solar-system')){prepareEditorial();const modern=document.body.dataset.presentationOwner==='atlas';if(!modern&&document.body.classList.contains('editorial'))editorialLegacy();let abort,dispose=()=>{},presentation=()=>{},navigationCleanup=()=>{},disclosures=()=>{};
 const boundary=document.createElement('p');boundary.className='solar-tool-boundary';boundary.dataset.modeBoundary='';document.querySelector('.planet-rail').after(boundary);
 const explain=mode=>{boundary.textContent=getModeContext('solar-system',mode)?.boundary||'';};
 const start=()=>{if(modern){presentation=applyPresentation(document.body,{surface:'scene'});navigationCleanup=mountWorkspaceNavigation(document.querySelector('.topbar'),{modeNav:document.querySelector('.modes'),actions:[document.getElementById('sources-open')]});disclosures=bindDisclosures(document.body);document.querySelector('.planet-rail').before(document.querySelector('.workspace'));}abort=new AbortController();const signal=abort.signal;initializeLegacyExperiment('solar-system',document.body,{signal,onModeChange:explain}).then(cleanup=>{if(signal.aborted)cleanup();else dispose=cleanup;});};start();window.addEventListener('pagehide',()=>{abort.abort();dispose();navigationCleanup();disclosures();presentation();});window.addEventListener('pageshow',e=>{if(e.persisted)start();});}
