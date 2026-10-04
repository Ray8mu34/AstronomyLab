import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {solarEquatorial,horizontal,equatorialVector,equatorialToLocal,dayLength,gnomon,parallaxDistance,starPosition,angularSeparation,airMass,calendarDrift} from '../../modules/sky-physics.mjs';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);
const checks=[];
function test(name,f){f();checks.push({name,state:'passed'});}
test('分至赤纬、北纬30°正午太阳高度与已知解析值',()=>{for(const [l,d,h] of [[0,0,60],[90,23.44,83.44],[180,0,60],[270,-23.44,36.56]]){const sun=solarEquatorial(l);near(sun.dec,d);near(horizontal(sun.ra,sun.dec,30,sun.ra).altitude,h);}});
test('赤道升落方向及天顶方位不定义',()=>{const rise=horizontal(0,0,0,-90);near(rise.altitude,0);near(rise.azimuth,90);near(horizontal(0,0,0,90).azimuth,270);assert.equal(horizontal(0,0,0,0).azimuth,null);});
test('坐标变换保向量范数，与高度上分量及天极高度一致',()=>{for(const lat of [-90,-60,0,30,90])for(const ra of [0,72,181,350])for(const dec of [-70,0,55,90]){const v=equatorialVector(ra,dec),local=equatorialToLocal(v,lat,41),h=horizontal(ra,dec,lat,41);near(Math.hypot(...local),1);near(local[2],h.up);near(local[0],h.east);near(local[1],h.north);}near(horizontal(0,90,30,137).altitude,30);});
test('昼长与独立日周数值积分一致，极点切线状态保留',()=>{for(const lat of [-70,-30,0,30,70])for(const dec of [-23.44,0,23.44]){let above=0;for(let i=0;i<36000;i++)above+=+(horizontal(0,dec,lat,(i+.5)/100).altitude>0);near(dayLength(lat,dec).hours,above/36000*24,.002);}assert.equal(dayLength(90,0).hours,null);assert.equal(dayLength(90,23.44).hours,24);assert.equal(dayLength(90,-23.44).hours,0);});
test('圭表三季影长及热带正午向南、无太阳无影长',()=>{for(const [dec,length] of [[0,.577350269],[23.44,.114995],[-23.44,1.348544]])near(gnomon(1,horizontal(0,dec,30,0)).length,length,.001);assert.ok(gnomon(1,horizontal(0,23.44,0,0)).north<0);assert.equal(gnomon(1,horizontal(0,0,30,180)).length,null);});
test('目录原始记录哈希、13条实际数据及距离信噪比约束',()=>{const dir=new URL('./',import.meta.url),data=JSON.parse(fs.readFileSync(new URL('stars.json',dir))),raw=fs.readFileSync(new URL('hip2-subset.tsv',dir));assert.equal(data.provenance.rawSHA256,createHash('sha256').update(raw).digest('hex'));assert.equal(data.stars.length,13);assert.equal(data.provenance.positionEpoch,1991.25);for(const s of data.stars)assert.ok(s.parallaxErrorMas/s.parallaxMas<.05);near(parallaxDistance(48.94,.77).pc,20.43318349,1e-7);assert.equal(parallaxDistance(-1,.1),null);assert.equal(parallaxDistance(1,.3),null);});
test('恢复距离仍保持地球方向，所有目录点角距一致',()=>{const data=JSON.parse(fs.readFileSync(new URL('stars.json',import.meta.url)));for(const s of data.stars){for(const blend of [0,.5,1]){const p=starPosition(s,blend);near(angularSeparation(p,equatorialVector(s.raDeg,s.decDeg)),0,.000002);if(blend===1)near(Math.hypot(...p),1000/s.parallaxMas);}}});
test('公历400年97闰与儒略100闰，整数累计差额0.12日/3.12日',()=>{near(calendarDrift(400,'gregorian').at(-1)[1],.12,1e-8);near(calendarDrift(400,'julian').at(-1)[1],3.12,1e-8);near(calendarDrift(400,'365').at(-1)[1],-96.88,1e-8);});
test('平面平行气团极限与低空禁止外推',()=>{near(airMass(90),1);near(airMass(30),2);assert.equal(airMass(14.99),null);assert.equal(airMass(-1),null);});
console.log(JSON.stringify({scope:'sky standalone maths and actual catalogue only; browser/render/human review remain separate',checks},null,2));
