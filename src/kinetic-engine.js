// Moteur de motion design procédural : timeline, easing, ressorts, caméra et composition.
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const ease=(t)=>{t=clamp(t);return t*t*(3-2*t)};
export const easeOut=(t)=>1-Math.pow(1-clamp(t),4);
export const backOut=(t,s=1.55)=>{t=clamp(t)-1;return 1+(s+1)*t*t*t+s*t*t};
export const smoother=(t)=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10)};
export const spring=(t,{frequency=5,damping=.72}={})=>1-Math.exp(-damping*frequency*t)*Math.cos(frequency*Math.sqrt(1-damping*damping)*t);
export const windowProgress=(t,start,duration)=>easeOut((t-start)/duration);
export const stagger=(t,start,index,delay=.08,duration=.48)=>windowProgress(t,start+index*delay,duration);
export const drift=(t,amplitude=1,speed=1,phase=0)=>Math.sin(t*speed+phase)*amplitude;
export function cubicPoint(a,b,c,d,t){const u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};}
export function withCamera(ctx,{x=0,y=0,zoom=1,rotation=0,pivotX=540,pivotY=960}={}){ctx.translate(pivotX+x,pivotY+y);ctx.rotate(rotation);ctx.scale(zoom,zoom);ctx.translate(-pivotX,-pivotY);}
export function roundedRect(ctx,x,y,w,h,r,fill,stroke=null,lineWidth=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}}
export function glow(ctx,x,y,r,color,alpha=1){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color.replace('ALPHA',String(alpha)));g.addColorStop(1,color.replace('ALPHA','0'));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
export function text(ctx,value,x,y,{size=64,weight=800,color='#fff',align='center',tracking=0,font='DM Sans'}={}){ctx.save();ctx.font=`${weight} ${size}px "${font}",sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;if(!tracking){ctx.fillText(value,x,y);}else{const chars=[...value],width=chars.reduce((s,ch)=>s+ctx.measureText(ch).width,0)+tracking*(chars.length-1);let px=x-(align==='center'?width/2:align==='right'?width:0);for(const ch of chars){ctx.fillText(ch,px,y);px+=ctx.measureText(ch).width+tracking;}}ctx.restore();}
export function drawDirector(ctx,t,progress=1){
  ctx.save();
  const reveal=clamp(progress);
  ctx.translate(540,1360+Math.sin(t*1.8)*3);
  // Ombre douce au sol
  ctx.fillStyle='rgba(0,0,0,.30)';ctx.beginPath();ctx.ellipse(0,310,235,30,0,0,Math.PI*2);ctx.fill();
  // Buste : veste de direction avec volumes et plis
  const jacket=ctx.createLinearGradient(-190,0,190,340);jacket.addColorStop(0,'#537b9d');jacket.addColorStop(.28,'#294f73');jacket.addColorStop(.7,'#183a5b');jacket.addColorStop(1,'#102841');
  ctx.fillStyle=jacket;ctx.beginPath();ctx.moveTo(-70,8);ctx.quadraticCurveTo(-155,15,-188,115);ctx.lineTo(-218,325);ctx.quadraticCurveTo(0,375,218,325);ctx.lineTo(188,115);ctx.quadraticCurveTo(155,15,70,8);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(211,229,242,.22)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-115,70);ctx.quadraticCurveTo(-150,190,-160,300);ctx.moveTo(115,70);ctx.quadraticCurveTo(150,190,160,300);ctx.stroke();
  // Chemise, col et cravate
  ctx.fillStyle='#f7f3ea';ctx.beginPath();ctx.moveTo(-54,0);ctx.lineTo(0,68);ctx.lineTo(54,0);ctx.lineTo(28,275);ctx.lineTo(0,295);ctx.lineTo(-28,275);ctx.closePath();ctx.fill();
  ctx.fillStyle='#d5dce1';ctx.beginPath();ctx.moveTo(-54,0);ctx.lineTo(-9,57);ctx.lineTo(-31,92);ctx.closePath();ctx.moveTo(54,0);ctx.lineTo(9,57);ctx.lineTo(31,92);ctx.closePath();ctx.fill();
  ctx.fillStyle='#d6a454';ctx.beginPath();ctx.moveTo(-13,74);ctx.lineTo(13,74);ctx.lineTo(10,222);ctx.lineTo(0,244);ctx.lineTo(-10,222);ctx.closePath();ctx.fill();
  // Cou et oreilles
  ctx.fillStyle='#a96549';ctx.beginPath();ctx.roundRect(-36,-95,72,112,20);ctx.fill();
  ctx.fillStyle='#bc7959';ctx.beginPath();ctx.ellipse(-96,-194,19,34,-.12,0,Math.PI*2);ctx.ellipse(96,-194,19,34,.12,0,Math.PI*2);ctx.fill();
  // Visage : forme asymétrique, ombres et lumière
  const skin=ctx.createLinearGradient(-105,-330,100,-80);skin.addColorStop(0,'#e2a47d');skin.addColorStop(.38,'#c98764');skin.addColorStop(.78,'#b87555');skin.addColorStop(1,'#8e503b');
  ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(-91,-285);ctx.quadraticCurveTo(-82,-356,-15,-359);ctx.quadraticCurveTo(79,-366,96,-292);ctx.lineTo(88,-169);ctx.quadraticCurveTo(76,-89,5,-78);ctx.quadraticCurveTo(-70,-83,-88,-165);ctx.closePath();ctx.fill();
  // Reflet latéral du visage
  ctx.fillStyle='rgba(255,220,185,.16)';ctx.beginPath();ctx.ellipse(-56,-236,17,77,-.15,0,Math.PI*2);ctx.fill();
  // Cheveux texturés et ligne de coupe
  const hair=ctx.createLinearGradient(-80,-380,80,-245);hair.addColorStop(0,'#18202a');hair.addColorStop(.55,'#30333a');hair.addColorStop(1,'#111923');
  ctx.fillStyle=hair;ctx.beginPath();ctx.moveTo(-101,-244);ctx.quadraticCurveTo(-124,-337,-62,-374);ctx.quadraticCurveTo(18,-412,83,-356);ctx.quadraticCurveTo(116,-327,105,-249);ctx.quadraticCurveTo(64,-285,32,-293);ctx.quadraticCurveTo(-23,-265,-101,-244);ctx.fill();
  ctx.strokeStyle='rgba(205,213,220,.25)';ctx.lineWidth=3;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(-70+i*20,-337-i%2*8);ctx.quadraticCurveTo(-42+i*17,-363-i%3*5,-20+i*18,-354);ctx.stroke();}
  // Sourcils, yeux, iris et paupières animées
  ctx.strokeStyle='#54372e';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-69,-225);ctx.quadraticCurveTo(-43,-239,-18,-224);ctx.moveTo(18,-224);ctx.quadraticCurveTo(43,-239,69,-225);ctx.stroke();
  const blink=(Math.abs(Math.sin(t*1.15))>.992)?0.18:1;
  ctx.fillStyle='#f8f0e7';ctx.beginPath();ctx.ellipse(-43,-197,20,13*blink,0,0,Math.PI*2);ctx.ellipse(43,-197,20,13*blink,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#543b2d';ctx.beginPath();ctx.arc(-42,-197,8,0,Math.PI*2);ctx.arc(44,-197,8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#171c22';ctx.beginPath();ctx.arc(-42,-197,4,0,Math.PI*2);ctx.arc(44,-197,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(-45,-200,2.5,0,Math.PI*2);ctx.arc(41,-200,2.5,0,Math.PI*2);ctx.fill();
  // Nez et bouche expressive
  ctx.strokeStyle='rgba(112,65,48,.55)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-191);ctx.quadraticCurveTo(-7,-159,3,-153);ctx.quadraticCurveTo(13,-149,18,-157);ctx.stroke();
  ctx.strokeStyle='#854c3d';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-28,-121);ctx.quadraticCurveTo(0,-111+Math.sin(t*4)*2,28,-121);ctx.stroke();
  ctx.strokeStyle='rgba(255,211,185,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-18,-132);ctx.quadraticCurveTo(0,-126,18,-132);ctx.stroke();
  // Bras articulés et mains visibles autour de la tablette
  ctx.strokeStyle='#1c4265';ctx.lineWidth=58;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-128,75);ctx.quadraticCurveTo(-210,151,-120,232);ctx.moveTo(128,75);ctx.quadraticCurveTo(210,151,120,232);ctx.stroke();
  ctx.fillStyle='#b97858';ctx.beginPath();ctx.ellipse(-116,237,25,31,-.2,0,Math.PI*2);ctx.ellipse(116,237,25,31,.2,0,Math.PI*2);ctx.fill();
  // Tablette professionnelle tenue devant lui
  ctx.save();ctx.translate(0,164);ctx.rotate(-.025+Math.sin(t*1.5)*.012);
  roundedRect(ctx,-139,-79,278,166,14,'#f8f7f2','#d9e0e5',3);roundedRect(ctx,-139,-79,278,31,10,'#173957');
  text(ctx,'GESTILYS',0,-63,{size:14,weight:900,color:'#fff',tracking:2});
  for(let i=0;i<3;i++){roundedRect(ctx,-105,-24+i*32,210-i*24,7,4,'#d5dde2');}
  roundedRect(ctx,-105,61,92,9,4,'#d9ad61');ctx.restore();
  ctx.restore();
}
