import {editorialLab} from './editorial-labs.js';
export const editorialEnabled=()=>new URLSearchParams(location.search).get('ui')!=='classic';
export function prepareEditorial(){document.body.classList.toggle('editorial',editorialEnabled());if(editorialEnabled()&&!document.getElementById('editorial-style')){const link=document.createElement('link');link.id='editorial-style';link.rel='stylesheet';link.href='/shared/editorial.css';document.head.append(link);}}
export function applyEditorial(app){if(!editorialEnabled()||app.dataset.page!=='lab'||location.pathname==='/lab/imaging')return()=>{};return editorialLab(app);}
