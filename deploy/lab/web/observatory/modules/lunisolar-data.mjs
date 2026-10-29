// Civil dates (UTC+8), transcribed from HKO Gregorian–Lunar conversion tables.
// This factual subset contains month starts and the twelve major solar terms.
// See /sources/lunisolar.md for original URLs and interpretation.
const names=['冬至','大寒','雨水','春分','谷雨','小满','夏至','大暑','处暑','秋分','霜降','小雪','冬至'];
const make=(starts,terms)=>Object.freeze({starts:Object.freeze(starts.split(' ')),terms:Object.freeze(terms.split(' ').map((date,i)=>Object.freeze({date,name:names[i],longitude:(270+i*30)%360}))) });
export const CALENDAR_CASES=Object.freeze({
 '2025':make('2024-12-01 2024-12-31 2025-01-29 2025-02-28 2025-03-29 2025-04-28 2025-05-27 2025-06-25 2025-07-25 2025-08-23 2025-09-22 2025-10-21 2025-11-20 2025-12-20 2026-01-19','2024-12-21 2025-01-20 2025-02-18 2025-03-20 2025-04-20 2025-05-21 2025-06-21 2025-07-22 2025-08-23 2025-09-23 2025-10-23 2025-11-22 2025-12-21'),
 '2026':make('2025-12-20 2026-01-19 2026-02-17 2026-03-19 2026-04-17 2026-05-17 2026-06-15 2026-07-14 2026-08-13 2026-09-11 2026-10-10 2026-11-09 2026-12-09 2027-01-08','2025-12-21 2026-01-20 2026-02-18 2026-03-20 2026-04-20 2026-05-21 2026-06-21 2026-07-23 2026-08-23 2026-09-23 2026-10-23 2026-11-22 2026-12-22'),
});
