// Navigation through the approved UI; scientific assertions remain in callers.
export async function imagingReveal(page,selector){
 const locator=page.locator(selector).first();
 if(selector==='[data-key="channel"]'&&!await locator.isVisible()){
  if(!await page.locator('.im-conditions').evaluate(e=>e.open))await page.locator('.im-conditions>summary').click();
  await page.locator('[data-gray-toggle]').click();
 }
 const paths=await locator.evaluate(e=>{const all=[];for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open){let t=p,parts=[];while(t&&t.tagName!=='HTML'){const siblings=[...t.parentElement.children].filter(n=>n.tagName===t.tagName);parts.unshift(t.tagName.toLowerCase()+':nth-of-type('+(siblings.indexOf(t)+1)+')');t=t.parentElement;}all.unshift(parts.join(' > ')+' > summary');}return all;});
 for(const path of paths)await page.locator(path).click();
}
export async function imagingClick(page,selector){await imagingReveal(page,selector);await page.locator(selector).first().click();}
