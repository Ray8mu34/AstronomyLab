import {CALENDAR_CASES} from './lunisolar-data.mjs';
export const TROPICAL_YEAR=365.2422,SYNODIC_MONTH=29.5306;
const DAY=86400000;
export function civilDay(date){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new RangeError('Invalid civil date');
 const t=Date.parse(date+'T00:00:00Z');
 if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==date)throw new RangeError('Invalid civil date');
 return t/DAY;
}
export function dateAt(day){return new Date(day*DAY).toISOString().slice(0,10);}
export function drift(years){
 if(!Number.isFinite(years)||years<0||years>19)throw new RangeError('Invalid year count');
 const solar=years*TROPICAL_YEAR,lunar=years*12*SYNODIC_MONTH;
 return {solar,lunar,delta:lunar-solar,phase:((lunar-solar)/TROPICAL_YEAR%1+1)%1,months:12*years};
}
export function metonicDifference(){return 235*SYNODIC_MONTH-19*TROPICAL_YEAR;}
export function numberMonths(starts,terms){
 if(!Array.isArray(starts)||starts.length<3||!Array.isArray(terms))throw new RangeError('Invalid calendar sequence');
 const boundaries=starts.map(civilDay),events=terms.map(term=>({...term,day:civilDay(term.date)}));
 if(boundaries.some((day,i)=>i&&day<=boundaries[i-1]))throw new RangeError('Nonmonotonic month starts');
 const winter=events.filter(t=>t.name==='冬至');
 if(winter.length!==2)throw new RangeError('Two winter solstices required');
 const containing=day=>boundaries.findIndex((start,i)=>i<boundaries.length-1&&day>=start&&day<boundaries[i+1]);
 const first=containing(winter[0].day),next=containing(winter[1].day),count=next-first;
 if(first<0||![12,13].includes(count))throw new RangeError('Unsupported solstice interval');
 const intervals=boundaries.slice(first,next+1).map((start,j)=>{
  const index=first+j,end=boundaries[index+1];
  return {index:j,start,end,startDate:dateAt(start),endDate:dateAt(end-1),days:end-start,terms:events.filter(t=>t.day>=start&&t.day<end)};
 });
 const leapIndex=count===13?intervals.slice(1,count).findIndex(m=>!m.terms.length)+1:-1;
 if(count===13&&leapIndex===0)throw new RangeError('No intercalary month in 13-month interval');
 let number=11;
 const months=intervals.map((month,i)=>{
  const leap=i===leapIndex;
  if(i&&!leap)number=number%12+1;
  return {...month,number,leap,following:i===count};
 });
 if(months.at(-1).number!==11)throw new RangeError('Next solstice month is not 11');
 return {count,leapIndex,months,terms:events,start:boundaries[first],end:boundaries[next+1],winters:winter};
}
export function calendarCase(id){
 if(!Object.hasOwn(CALENDAR_CASES,id))throw new RangeError('Unknown calendar example');
 const example=CALENDAR_CASES[id];return {id,...numberMonths(example.starts,example.terms)};
}
const numerals=['','正','二','三','四','五','六','七','八','九','十','十一','十二'];
export const monthName=month=>(month.leap?'闰':'')+numerals[month.number]+'月';
