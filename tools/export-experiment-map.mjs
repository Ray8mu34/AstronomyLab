import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {confirmedModes,experimentURL} from '../web/observatory/shared/tool-registry.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function readExperimentMap(projectRoot=root){
 const map=JSON.parse(fs.readFileSync(path.join(projectRoot,'course/experiments.json'),'utf8'));
 const catalog=JSON.parse(fs.readFileSync(path.join(projectRoot,'course/chapters.json'),'utf8'));
 if(map.version!==1||map.chapters.length!==catalog.chapters.length)throw Error('Experiment map edition does not match the chapter catalogue');
 const seen=new Set();
 for(const [i,chapter]of map.chapters.entries()){
  const expected=catalog.chapters[i];
  if(chapter.number!==expected.number||chapter.path!==expected.path||chapter.title!==expected.title)throw Error('Experiment chapter identity mismatch: '+chapter.number);
  const text=fs.readFileSync(path.join(projectRoot,chapter.path),'utf8');
  const headings=new Set([...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m=>m[1].replace(/\s*\{[^}]*\}\s*$/,'').trim()));
  for(const item of chapter.experiments){
   if(!Object.hasOwn(confirmedModes,item.slug)||!confirmedModes[item.slug].includes(item.mode)||!headings.has(item.section)||!item.label||!item.purpose)throw Error('Invalid experiment correspondence: '+chapter.number+'/'+item.slug+'/'+item.mode);
   seen.add(item.slug+'/'+item.mode);
  }
  if(!chapter.question||!Array.isArray(chapter.remaining))throw Error('Incomplete chapter mapping');
 }
 const expected=Object.entries(confirmedModes).flatMap(([slug,modes])=>modes.map(mode=>slug+'/'+mode));
 for(const key of expected)if(!seen.has(key))throw Error('Unmapped public experiment: '+key);
 return map;
}

export function experimentMapHTML(map){
 const format={interactive:'交互',static:'图版',data:'数据对照'};
 const chapters=map.chapters.map(chapter=>{
  const number=String(chapter.number).padStart(2,'0');
  const rows=chapter.experiments.map(item=>{
   const route=experimentURL(item.slug,item.mode);
   return `<li><a data-lab-path="${esc(route)}" href="http://127.0.0.1:4189${esc(route)}">${esc(item.label)} ↗</a><span class="experiment-section">${esc(item.section)}</span><p>${esc(item.purpose)}</p></li>`;
  }).join('');
  const remaining=chapter.remaining.length?`<details class="remaining"><summary>延伸方向</summary><ul>${chapter.remaining.map(item=>`<li>${esc(item.topic)} <span class="experiment-section">${esc(format[item.format]||item.format)}</span></li>`).join('')}</ul></details>`:'';
  return `<details class="chapter-experiments" id="chapter-${number}"><summary>${number} ${esc(chapter.title)}</summary><p>${esc(chapter.question)}</p><a href="chapters/${number}.html">阅读讲义 →</a><ul class="experiment-links">${rows}</ul>${remaining}</details>`;
 }).join('');
 return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>讲义与实验对应</title><link rel="stylesheet" href="article-reading.css"><style>
 .chapter-experiments{border-bottom:1px solid var(--line);padding:0;margin:0}.chapter-experiments>summary{padding:16px 0;min-height:44px;box-sizing:border-box;cursor:pointer;font-weight:600}.experiment-links{list-style:none;padding:0}.experiment-links>li{margin:20px 0}.experiment-links p{margin:4px 0}.experiment-section{display:block;color:var(--muted);font-size:.82em}.remaining{margin:16px 0 24px}.remaining>summary{cursor:pointer;min-height:44px}.experiment-host{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:20px 0}.experiment-host[hidden]{display:none}.experiment-host label{display:grid;gap:4px;flex:1;min-width:0}.experiment-host input{box-sizing:border-box;width:100%;min-height:44px;font:inherit;border:1px solid var(--line);padding:6px 10px}.experiment-host button{font:inherit;padding:6px 16px;min-height:44px;cursor:pointer}.host-error{color:#962f2f;font-size:.85em}.host-error:empty{display:none}:is(a,summary,button,input):focus-visible{outline:3px solid var(--link);outline-offset:3px}
 </style></head><body><nav class="reading-nav"><a href="index.html">文章目录</a></nav><h1>讲义与实验对应</h1><form class="experiment-host" novalidate hidden><label for="lab-address">实验室地址<input id="lab-address" type="url" value="http://127.0.0.1:4189" aria-describedby="host-error"></label><button type="submit">应用地址</button></form><p id="host-error" class="host-error" role="alert"></p>${chapters}<script>
 const form=document.querySelector('.experiment-host'),input=document.getElementById('lab-address'),error=document.getElementById('host-error');
 function setHost(value){try{const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error();for(const a of document.querySelectorAll('[data-lab-path]'))a.href=new URL(a.dataset.labPath,url.origin).href;error.textContent='';input.removeAttribute('aria-invalid');return true;}catch{error.textContent='请输入完整的 http 或 https 实验室地址。';input.setAttribute('aria-invalid','true');return false;}}
 if(['http:','https:'].includes(location.protocol))setHost(location.origin);else form.hidden=false;
 form.addEventListener('submit',event=>{event.preventDefault();if(!setHost(input.value))input.focus();});
 function openChapter(){const target=document.getElementById(location.hash.slice(1));if(target?.matches('.chapter-experiments')){target.open=true;target.scrollIntoView();}}
 addEventListener('hashchange',openChapter);openChapter();
 document.addEventListener('keydown',event=>{if(event.key!=='Escape'||event.target.matches('input,select,textarea'))return;const details=event.target.closest('details[open]');if(details){details.open=false;details.querySelector('summary').focus();event.preventDefault();}});
 </script></body></html>`;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const index=process.argv.indexOf('--out');if(index<0||!process.argv[index+1])throw Error('Expected --out <generated HTML file>');
 const out=path.resolve(process.argv[index+1]),map=readExperimentMap();fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,experimentMapHTML(map));
 console.log(JSON.stringify({chapters:map.chapters.length,links:map.chapters.reduce((n,c)=>n+c.experiments.length,0),output:path.relative(root,out)}));
}
