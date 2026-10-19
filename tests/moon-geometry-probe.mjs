// CSS-pixel science measurement shared by the atlas checks. No model writes.
export async function geometry(page){
 return page.evaluate(()=>{
  const lab=window.earthMoon,V=lab.moon.position.constructor;
  const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const s=rect(document.querySelector('#space')),o=rect(document.querySelector('#observed')),clock=rect(document.querySelector('.reduced-transport'));
  const project=(v,camera,box)=>{const q=v.clone().project(camera);return{x:box.x+(q.x+1)*box.width/2,y:box.y+(1-q.y)*box.height/2};};
  const bounds=points=>{const xs=points.map(p=>p.x),ys=points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),right:Math.max(...xs),bottom:Math.max(...ys)};};
  const silhouette=(mesh,camera,box)=>{const pts=[];for(let i=0;i<96;i++){const a=i/96*Math.PI*2;for(const xyz of [[Math.cos(a),Math.sin(a),0],[Math.cos(a),0,Math.sin(a)],[0,Math.cos(a),Math.sin(a)]])pts.push(project(new V(...xyz).multiplyScalar(mesh.scale.x).add(mesh.position),camera,box));}return bounds(pts);};
  const earth=lab.scene.children.find(n=>n.isMesh&&n.material?.uniforms?.physicalRadius?.value===lab.physics.C.earthRadius);
  const orbit=lab.scene.children.find(n=>n.isLine&&n.geometry.attributes.position.count===257),pos=orbit.geometry.attributes.position;
  const objects={earth:silhouette(earth,lab.camera,s),moon:silhouette(lab.moon,lab.camera,s),orbit:bounds(Array.from({length:pos.count},(_,i)=>project(new V().fromBufferAttribute(pos,i),lab.camera,s)))};
  const solar=lab.scene.children.find(n=>n.isGroup&&n.children.some(c=>c.isMesh&&c.material?.color?.getHex()===0xf9cc6e));solar.updateMatrixWorld(true);const sun=solar.children.find(n=>n.isMesh),sunPoints=[];
  for(let i=0;i<96;i++){const a=i/96*Math.PI*2;for(const xyz of [[Math.cos(a),Math.sin(a),0],[Math.cos(a),0,Math.sin(a)],[0,Math.cos(a),Math.sin(a)]])sunPoints.push(project(new V(...xyz).multiplyScalar(sun.geometry.parameters.radius).applyMatrix4(sun.matrixWorld),lab.camera,s));}objects['sun-beacon']=bounds(sunPoints);
  for(const [i,arrow]of solar.children.filter(n=>n.type==='ArrowHelper').entries()){const pts=[];arrow.traverse(n=>{const position=n.geometry?.attributes.position;if(position)for(let j=0;j<position.count;j++)pts.push(project(new V().fromBufferAttribute(position,j).applyMatrix4(n.matrixWorld),lab.camera,s));});objects['light-arrow-'+i]=bounds(pts);}
  for(const id of ['solar-ray','solar-arrow','solar-dot','solar-word','earth-label','moon-label'])objects[id]=rect(document.getElementById(id));
  const centres={earth:project(new V(),lab.camera,s),moon:project(lab.moon.position,lab.camera,s)};
  return{objects,centres,clock,space:s,observed:o,observedMoon:silhouette(lab.observedMoon,lab.observerCamera,o),caption:rect(document.querySelector('.subject-caption')),scrollY,viewport:{width:innerWidth,height:innerHeight},state:lab.getState(),documentWidth:document.documentElement.scrollWidth};
 });
}
