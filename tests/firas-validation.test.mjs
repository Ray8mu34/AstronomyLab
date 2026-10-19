import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {parseFiras,validateFirasProduct,FIRAS_MONOPOLE_V1,firasTextSHA256} from '../web/observatory/modules/galaxy-physics.mjs';
import {firasText,firasHeader,firasLines,invalidFiras,replaceCell} from './firas-fixtures.mjs';

test('FIRAS v1 retains official columns, signed residuals and correct cm^-1 → GHz conversion',async()=>{
 const {rows,product,numericSHA256}=await validateFirasProduct(firasText);
 assert.equal(rows.length,43);assert.equal(product.id,FIRAS_MONOPOLE_V1.id);
 assert.equal(rows[0].frequencyGHz,2.27*299792458/1e7);
 assert.deepEqual(rows[0],{frequencyGHz:68.052887966,intensity:200.723,residual:5,sigma:14,galaxy:4});
 assert.equal(rows[5].residual,-30);assert.equal(rows[2].galaxy,-1);
 assert.equal(rows.at(-1).residual,-432);assert.equal(rows.at(-1).sigma,282);
 const independent=crypto.createHash('sha256').update(JSON.stringify(firasLines.map(s=>s.trim().split(/\s+/).map(Number)))).digest('hex');
 assert.equal(numericSHA256,independent);
});
test('FIRAS schema validity is independent from the fixed 43-row v1 product identity',async()=>{
 assert.equal(parseFiras(firasLines[0]).length,1);
 assert.equal(parseFiras(invalidFiras.differentNumbers.text).length,43);
 await assert.rejects(validateFirasProduct(firasHeader+firasLines[0]),{code:'completeness'});
 await assert.rejects(validateFirasProduct(invalidFiras.differentNumbers.text),{code:'identity'});
 assert.equal((await validateFirasProduct(firasText.replace(/\r?\n/g,'\r\n').replace(/ {2,}/g,'\t'))).rows.length,43);
});
for(const [name,{text,code}] of Object.entries(invalidFiras))test('FIRAS rejects '+name,async()=>{
 await assert.rejects(validateFirasProduct(text),{name:'FirasValidationError',code});
});
test('All five FIRAS columns reject non-finite values before product identity checks',async()=>{
 for(let column=0;column<5;column++)for(const value of ['NaN','Infinity','1e309'])await assert.rejects(validateFirasProduct(replaceCell(3,column,value)),{code:'number'});
});
test('FIRAS SHA-256 fallback matches independent crypto, still validates identity without a secure context',async()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 try{Object.defineProperty(globalThis,'crypto',{configurable:true,value:undefined});
  for(const input of ['', 'abc', '天文光谱 µK 🌌', 'a'.repeat(64), 'b'.repeat(1000), firasText])assert.equal(await firasTextSHA256(input),crypto.createHash('sha256').update(input).digest('hex'));
  assert.equal((await validateFirasProduct(firasText)).rows.length,43);
  await assert.rejects(validateFirasProduct(invalidFiras.differentNumbers.text),{code:'identity'});
 }finally{Object.defineProperty(globalThis,'crypto',descriptor);}
});
