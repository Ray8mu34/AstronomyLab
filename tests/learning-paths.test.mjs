import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {learningPaths,pathsForLesson,pathsForExperiment,readingURL} from '../web/observatory/shared/learning-paths.js';
import {confirmedModes,lessonEntries,experimentURL} from '../web/observatory/shared/course-map.js';

const articleHTML=new Map(await Promise.all(Array.from({length:16},async(_,i)=>{
 const lesson=i+1;
 return [lesson,await readFile(new URL(`../build/articles/L${String(lesson).padStart(2,'0')}.html`,import.meta.url),'utf8')];
})));
const publicKeys=['anchor','id','label','lesson','mode','slug'];

test('public mapping contains all 16 lessons and every one of the 43 registered modes',()=>{
 const expected=Object.entries(confirmedModes).flatMap(([slug,modes])=>modes.map(mode=>`${slug}/${mode}`));
 assert.equal(expected.length,43,'registry expectation must be reviewed if mode count changes');
 assert.deepEqual([...new Set(learningPaths.map(p=>`${p.slug}/${p.mode}`))].sort(),expected.sort());
 assert.deepEqual([...new Set(learningPaths.map(p=>p.lesson))].sort((a,b)=>a-b),Array.from({length:16},(_,i)=>i+1));
 for(const lesson of articleHTML.keys())assert(pathsForLesson(lesson).length>0,`L${lesson} has no related experiment`);
});

test('every unique record points to a real article section and known mode',()=>{
 const ids=new Set();
 for(const p of learningPaths){
  assert.deepEqual(Object.keys(p).sort(),publicKeys,'only reading metadata belongs in the public registry');
  assert.match(p.id,/^l\d{2}-[a-z0-9-]+$/);assert(!ids.has(p.id),`duplicate ID: ${p.id}`);ids.add(p.id);
  assert(Number.isInteger(p.lesson)&&p.lesson>=1&&p.lesson<=16);
  assert(confirmedModes[p.slug]?.includes(p.mode),`unknown mode: ${p.slug}/${p.mode}`);
  assert(p.label.trim().length>0&&p.anchor.trim().length>0);
  const html=articleHTML.get(p.lesson);
  // A section ID is a navigation target with a heading, not a TOC link or
  // an accidental string inside article prose. Check it occurs exactly once.
  assert.equal([...html.matchAll(/\bid="([^"]+)"/g)].filter(m=>m[1]===p.anchor).length,1,`missing or duplicate article anchor: ${p.id}`);
  assert(html.includes(`<section id="${p.anchor}" class="level2">`),`anchor is not a content section: ${p.id}`);
  assert(pathsForLesson(p.lesson).includes(p));assert(pathsForExperiment(p.slug,p.mode).includes(p));
  const url=new URL(readingURL(p),'https://example.test');
  assert.equal(url.pathname,`/read/${String(p.lesson).padStart(2,'0')}`);assert.equal(decodeURIComponent(url.hash.slice(1)),p.anchor);
  const experiment=new URL(experimentURL(p.slug,p.mode),'https://example.test');assert.equal(experiment.searchParams.get('mode'),p.mode);
 }
});

test('month-period route and existing Hertzsprung–Russell mode are attached to the right article',()=>{
 const month=pathsForExperiment('earth-moon','period');
 assert.equal(month.length,1);assert.equal(month[0].lesson,3);assert.equal(month[0].anchor,'一个月为什么会有两种长度');
 assert(lessonEntries[11].targets.some(p=>p.slug==='stars'&&p.mode==='hr'));
 assert.equal(pathsForExperiment('stars','hr')[0].anchor,'把几百万颗恒星放到同一张图上');
});

test('invalid inputs have no invented reading paths and cannot override trusted targets',()=>{
 for(const value of [0,17,NaN,null,undefined,'bad',1.5])assert.deepEqual(pathsForLesson(value),[]);
 assert.deepEqual(pathsForLesson('03'),pathsForLesson(3));
 for(const [slug,mode] of [['sky','missing'],['missing','sky'],['solar-system',null],['stars','__proto__'],['__proto__','hr']])assert.deepEqual(pathsForExperiment(slug,mode),[]);
 assert.equal(experimentURL('sky','missing'),'/lab/sky');assert.equal(experimentURL('__proto__','hr'),'/lab/__proto__');
 assert.equal(readingURL(null),'/courses');assert.equal(readingURL({id:'unknown'}),'/courses');
 const real=learningPaths[0];assert.equal(readingURL({...real,lesson:999,anchor:'javascript:alert(1)'}),readingURL(real));
 assert(Object.isFrozen(learningPaths));assert(learningPaths.every(Object.isFrozen));
});
