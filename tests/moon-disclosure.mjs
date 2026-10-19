// Navigate the approved progressive-disclosure UI without changing any model
// assertions or scientific API contracts in the existing regression suites.
export async function moonReveal(page,selector){
 await page.waitForFunction(()=>document.querySelector('#phase-ui'));
 const target=page.locator(selector);
 if(await page.locator('body[class*="atlas-"]').count()){
  const owner=await target.count()?await target.first().evaluate(e=>e.closest('#condition-menu')?'condition':e.closest('#phase-menu')?'phase':null):null;
  // A learner first closes the current popover before reaching a control in
  // another layer. Visibility alone does not detect a top-layer interception.
  if(owner!=='condition'&&selector!=='#condition-entry'&&await page.locator('#condition-menu').isVisible())await page.locator('[aria-label="关闭条件"]').click();
  if(owner!=='phase'&&selector!=='#phase-entry'&&await page.locator('#phase-menu').isVisible())await page.locator('#phase-entry').click();
  if(!await target.isVisible()&&await target.count()){
   const menu=await target.first().evaluate(e=>e.closest('#condition-menu')?'condition':e.closest('#phase-menu')?'phase':null);
   if(menu==='condition'&&!await page.locator('#condition-menu').isVisible())await page.locator('#condition-entry').click();
   if(menu==='phase'&&!await page.locator('#phase-menu').isVisible())await page.locator('#phase-entry').click();
   for(const detail of await target.first().locator('xpath=ancestor::details').all())if(!await detail.evaluate(e=>e.open))await detail.locator(':scope > summary').click();
  }
  if(!await target.isVisible())throw Error('Atlas control remains inaccessible after authored disclosure: '+selector);
  return target;
 }
 if(!await target.isVisible()&&await page.locator('body.eclipse-observing').count()){
  if(selector.includes('[data-mode'))await page.locator('#eclipse-modes').evaluate(el=>el.open=true);
  else if(selector.includes('[data-preset')||selector.includes('[data-guide-action="eclipse'))await page.locator('#eclipse-presets').evaluate(el=>el.open=true);
  else{if(await page.locator('#eclipse-information').getAttribute('open')===null)await page.locator('#eclipse-condition-entry').click();if(['#inclination','#distance','#node','#east','#north'].includes(selector))await page.locator('#eclipse-parameter').selectOption(selector.slice(1));else{await page.locator('#eclipse-extras').evaluate(el=>el.open=true);if(['#scale','#oblique','#top','#presentation'].includes(selector)||selector.includes('[data-view'))await page.locator('#eclipse-display').evaluate(el=>el.open=true);}}
 }
 if(!await target.isVisible()&&await page.locator('body.period-observing').count()){
  if(selector.includes('[data-mode'))await page.locator('#period-modes').evaluate(el=>el.open=true);
  else if(['#epoch','#sidereal','#synodic','#play-sidereal','#play-synodic'].includes(selector)||selector.includes('[data-guide-action="day'))await page.locator('#period-times').evaluate(el=>el.open=true);
  else{if(await page.locator('#period-information').getAttribute('open')===null)await page.locator('#period-info-entry').click();if(['#scale','#oblique','#top','#presentation'].includes(selector)||selector.includes('[data-view'))await page.locator('#period-view-settings').evaluate(el=>el.open=true);}
 }
 if(!await target.isVisible()&&await page.locator('body.spin-observing').count()){
  if(selector.includes('[data-mode'))await page.locator('#spin-modes').evaluate(el=>el.open=true);
  else if(selector.startsWith('[data-guide-action="day'))await page.locator('#spin-times').evaluate(el=>el.open=true);
  else{if(await page.locator('#spin-information').getAttribute('open')===null)await page.locator('#spin-information-entry').click();if(['#scale','#oblique','#top','#presentation'].includes(selector)||selector.includes('[data-view'))await page.locator('#spin-view-settings').evaluate(el=>el.open=true);}
 }
 if(!await target.isVisible()&&await page.locator('#mode-entry').isVisible()){
   if(selector.includes('[data-mode'))await page.click('#mode-entry');
  else if(selector.startsWith('[data-phase')||selector.startsWith('[data-guide-action="phase'))await page.click('#phase-entry');
  else{
   if(!await page.locator('#condition-menu').isVisible())await page.click('#condition-entry');
   if(['#scale','#oblique','#top','#presentation'].includes(selector)||selector.startsWith('[data-view')){
    if(await page.locator('.view-settings').getAttribute('open')===null)await page.click('.view-settings summary');
   }
  }
 }
 return target;
}
export async function moonClick(page,selector){await(await moonReveal(page,selector)).click();}
