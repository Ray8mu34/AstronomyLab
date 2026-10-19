import fs from 'node:fs';
export const firasText=fs.readFileSync(new URL('../web/observatory/data/galaxy/firas_monopole_spec_v1.txt',import.meta.url),'utf8');
export const firasLines=firasText.split(/\r?\n/).filter(s=>s.trim()&&!s.trim().startsWith('#'));
export const firasHeader=firasText.split(/\r?\n/).filter(s=>s.trim().startsWith('#')).join('\n')+'\n';
export function replaceCell(row,column,value){return firasHeader+firasLines.map((s,i)=>i===row?s.trim().split(/\s+/).map((x,j)=>j===column?String(value):x).join(' '):s).join('\n');}
export const invalidFiras={
 empty:{text:'# empty table',code:'empty'},html:{text:'<!doctype html><html><body>Service unavailable</body></html>',code:'columns'},
 truncated:{text:firasHeader+firasLines[0],code:'completeness'},missingColumn:{text:replaceCell(0,4,'').trim(),code:'columns'},
 extraColumn:{text:replaceCell(0,4,'4 7'),code:'columns'},NaN:{text:replaceCell(0,1,'NaN'),code:'number'},
 Infinity:{text:replaceCell(0,2,'Infinity'),code:'number'},overflow:{text:replaceCell(0,4,'1e309'),code:'number'},
 negativeSigma:{text:replaceCell(0,3,-14),code:'sigma'},zeroSigma:{text:replaceCell(0,3,0),code:'sigma'},
 negativeIntensity:{text:replaceCell(0,1,-1),code:'intensity'},zeroFrequency:{text:replaceCell(0,0,0),code:'frequency'},
 duplicate:{text:firasHeader+[firasLines[0],...firasLines.slice(0,-1)].join('\n'),code:'frequency'},
 unordered:{text:firasHeader+[firasLines[1],firasLines[0],...firasLines.slice(2)].join('\n'),code:'frequency'},
 wrongUnits:{text:firasText.replace('units = cm^-1','units = GHz'),code:'units'},
 prefixedWavenumberUnits:{text:firasText.replace('units = cm^-1','units = cm^-10'),code:'units'},
 prefixedIntensityUnits:{text:firasText.replace('units = MJy/sr','units = MJy/sr_wrong'),code:'units'},
 prefixedResidualUnits:{text:firasText.replace('units = kJy/sr','units = kJy/sr_wrong'),code:'units'},
 wrongProduct:{text:firasText.replace('v1  : initial release','v2  : initial release'),code:'product'},
 differentNumbers:{text:replaceCell(0,1,201),code:'identity'}
};
