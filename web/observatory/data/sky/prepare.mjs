// 将已取得的原始TSV确定性转换；不下载或修改原文。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const dir = path.dirname(fileURLToPath(import.meta.url));
const names = {54061:'天枢 · HIP 54061',53910:'天璇 · HIP 53910',58001:'天玑 · HIP 58001',59774:'天权 · HIP 59774',62956:'玉衡 · HIP 62956',65378:'开阳 · HIP 65378',67301:'摇光 · HIP 67301',21421:'毕宿五 · Aldebaran',20889:'ε Tau · HIP 20889',20205:'γ Tau · HIP 20205',20455:'δ Tau · HIP 20455',20894:'θ² Tau · HIP 20894',20885:'θ¹ Tau · HIP 20885'};
const text = fs.readFileSync(path.join(dir,'hip2-subset.tsv'),'utf8');
const stars = text.split(/\r?\n/).filter(line => /^\s*\d+\t/.test(line)).map(line => {
  const [hip,raDeg,decDeg,parallaxMas,parallaxErrorMas,pmRaMasYear,pmDecMasYear,hpMag]=line.trim().split('\t').map(Number);
  return {hip,label:names[hip],group:hip>50000?'dipper':'hyades',raDeg,decDeg,parallaxMas,parallaxErrorMas,pmRaMasYear,pmDecMasYear,hpMag};
});
if(stars.length !== 13 || stars.some(s=>!s.label || s.parallaxMas<=0)) throw Error('目录子集不完整');
const provenance={catalogue:'I/311/hip2, van Leeuwen (2007), A&A 474,653',frame:'ICRS',positionEpoch:1991.25,queryDate:'2026-10-03',angleUnits:'deg (VizieR returned units; despite RArad field name)',properMotionUnits:'mas/year',parallaxUnits:'mas',distanceMethod:'d=1000/parallax, first-order sigma=1000*e/parallax²; no propagation or Bayesian inference',sourceURL:text.match(/#INFO\trequest=(.*?)\t/)?.[1],rawSHA256:createHash('sha256').update(fs.readFileSync(path.join(dir,'hip2-subset.tsv'))).digest('hex'),representation:'13 actual catalogue entries selected for direction/distance demonstration, not complete cluster membership or all-sky catalogue',license:'VizieR scientific usage with author/publication/CDS attribution; commercial redistribution not established'};
fs.writeFileSync(path.join(dir,'stars.json'),JSON.stringify({provenance,stars},null,2)+'\n');
console.log('Prepared13 actual catalogue entries with source hash.');
