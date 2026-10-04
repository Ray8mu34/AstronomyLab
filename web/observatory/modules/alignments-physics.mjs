export const TAU=2*Math.PI,RAD=Math.PI/180;
export const parameters={earth:{a:1,period:365.256},venus:{a:.723332,period:224.701},mars:{a:1.523679,period:686.98}};
export const clamp=(x,a=-1,b=1)=>Math.max(a,Math.min(b,x));
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>Math.hypot(...a);
export const angle=(a,b)=>Math.acos(clamp(dot(a,b)/(norm(a)*norm(b))));
export function body(p,t,inclination=0,node=0){const a=TAU*t/p.period-node*RAD,c=Math.cos(a)*p.a,s=Math.sin(a)*p.a;return[c*Math.cos(node*RAD)-s*Math.cos(inclination*RAD)*Math.sin(node*RAD),c*Math.sin(node*RAD)+s*Math.cos(inclination*RAD)*Math.cos(node*RAD),s*Math.sin(inclination*RAD)];}
export function synodic(name){return 1/Math.abs(1/parameters[name].period-1/parameters.earth.period);}
export function configuration(name,t,inclination=0,node=0){const E=body(parameters.earth,t),B=body(parameters[name],t,inclination,node),S=[0,0,0],sight=sub(B,E),phase=angle(sub(S,B),sub(E,B));const lon=Math.atan2(sight[1],sight[0]),lat=Math.atan2(sight[2],Math.hypot(sight[0],sight[1]));return{E,B,sight,distance:norm(sight),phase,k:(1+Math.cos(phase))/2,elongation:angle(sub(S,E),sight),longitude:lon,latitude:lat};}
export function skyRate(t,inclination=0,node=0){const a=configuration('mars',t-.01,inclination,node).longitude,b=configuration('mars',t+.01,inclination,node).longitude;return Math.atan2(Math.sin(b-a),Math.cos(b-a))/.02/RAD;}
export function circleOverlap(R,r,d){if(d>=R+r)return 0;if(d<=Math.abs(R-r))return Math.PI*Math.min(R,r)**2;const a=Math.acos(clamp((d*d+R*R-r*r)/(2*d*R))),b=Math.acos(clamp((d*d+r*r-R*R)/(2*d*r)));return R*R*a+r*r*b-.5*Math.sqrt(Math.max(0,(-d+R+r)*(d+R-r)*(d-R+r)*(d+R+r)));}
export function transitFlux(x,r=.1,b=.3){return 1-circleOverlap(1,r,Math.hypot(x,b))/Math.PI;}
