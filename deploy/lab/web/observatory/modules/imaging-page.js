// The approved presentation wraps the unchanged scientific module.
import {mount as original} from './imaging.js';
import {install} from './imaging-ui.js';
export async function mount(el,options={}){
 const pending=original(el,options);
 const release=install(el,options.signal);
 const api=await pending;
 if(options.signal?.aborted)release();
 return {...api,dispose(){release();api.dispose();}};
}
