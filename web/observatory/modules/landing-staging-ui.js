// Layout only; the process module retains equations, time, events and native inputs.
export function attachProcessUI(root){
 let openState=[];
 function beforeBuild(partial){if(!partial)openState=[...root.querySelectorAll('details')].map(d=>d.open);}
 function sync(){
  if(!root.querySelector('.process-clock')){const clock=document.createElement('div');clock.className='process-clock';root.querySelector('.ls-process').before(clock);for(const selector of ['.ls-transport','.ls-scrubber','.ls-timeline'])clock.append(root.querySelector(selector));root.querySelectorAll('details').forEach((d,i)=>{d.open=!!openState[i];});}
  for(const button of root.querySelectorAll('button'))button.classList.add('al-button');for(const details of root.querySelectorAll('details'))details.classList.add('al-disclosure');for(const control of root.querySelectorAll('.ls-control'))control.classList.add('al-parameter');
 }
 return{beforeBuild,sync,dispose(){}};
}

