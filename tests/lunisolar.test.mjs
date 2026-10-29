import test from 'node:test';
import assert from 'node:assert/strict';
import {CALENDAR_CASES} from '../web/observatory/modules/lunisolar-data.mjs';
import {civilDay,drift,metonicDifference,calendarCase,numberMonths,monthName} from '../web/observatory/modules/lunisolar-physics.mjs';
const near=(actual,expected,tolerance=1e-9)=>assert(Math.abs(actual-expected)<tolerance,`${actual} vs ${expected}`);
test('mean 12-month year and 19-year approximation preserve their distinct residuals',()=>{
 near(drift(1).lunar,354.3672);near(drift(1).delta,-10.875);near(drift(19).delta,-206.625);near(metonicDifference(),.0892);
 near(drift(0).phase,0);near(drift(8).phase,1-87/365.2422);
});
test('official 2025 winter-to-winter sequence assigns the leap sixth month',()=>{
 const c=calendarCase('2025');assert.equal(c.count,13);assert.equal(c.leapIndex,8);
 assert.deepEqual(c.months.map(m=>m.number),[11,12,1,2,3,4,5,6,6,7,8,9,10,11]);
 const m=c.months[8];assert.equal(monthName(m),'闰六月');assert.equal(m.startDate,'2025-07-25');assert.equal(m.endDate,'2025-08-22');assert.equal(m.days,29);assert.equal(m.terms.length,0);
});
test('a solar term on the next first day belongs to that new civil month',()=>{
 const c=calendarCase('2025'),term=c.terms.find(t=>t.name==='处暑');assert.equal(term.date,'2025-08-23');
 assert(!c.months[8].terms.includes(term));assert.equal(c.months[9].terms[0].date,'2025-08-23');assert.equal(c.months[9].number,7);
});
test('official 2026 interval has twelve months and no leap month',()=>{
 const c=calendarCase('2026');assert.equal(c.count,12);assert.equal(c.leapIndex,-1);
 assert.deepEqual(c.months.map(m=>m.number),[11,12,1,2,3,4,5,6,7,8,9,10,11]);
 assert.equal(c.months[2].startDate,'2026-02-17');assert.equal(c.months[9].startDate,'2026-09-11');
});
test('calendar boundaries remain contiguous 29/30-day civil months with two anchored winters',()=>{
 for(const id of Object.keys(CALENDAR_CASES)){
  const c=calendarCase(id);assert(c.months.every(m=>[29,30].includes(m.days)));
  assert.equal(c.months.reduce((sum,m)=>sum+m.days,0),c.end-c.start);
  for(let i=1;i<c.months.length;i++)assert.equal(c.months[i-1].end,c.months[i].start);
  for(const winter of c.winters)assert.equal(c.months.find(m=>m.start<=winter.day&&winter.day<m.end).number,11);
 }
});
test('a term-free month alone does not trigger intercalation in a twelve-month interval',()=>{
 const data=CALENDAR_CASES['2026'],terms=data.terms.filter(t=>t.name!=='春分');
 const c=numberMonths(data.starts,terms);assert.equal(c.leapIndex,-1);assert(c.months.some(m=>!m.terms.length));
});
test('invalid dates and unsupported identities are rejected explicitly',()=>{
 for(const value of ['2025-02-29','2026-13-01','2026-1-1',null])assert.throws(()=>civilDay(value));
 for(const value of [-1,20,NaN])assert.throws(()=>drift(value));
 assert.throws(()=>calendarCase('__proto__'));assert.throws(()=>numberMonths(['2025-01-01','2025-01-01','2026-01-01'],[]));
});
