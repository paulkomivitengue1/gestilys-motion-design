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
  ctx.save();ctx.translate(540,1370+Math.sin(t*2.6)*4);const p=clamp(progress);
  // Ombre et buste avec construction articulée
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,310,220,28,0,0,Math.PI*2);ctx.fill();
  const coat=ctx.createLinearGradient(-180,0,180,340);coat.addColorStop(0,'#47749a');coat.addColorStop(.5,'#1d4266');coat.addColorStop(1,'#102840');
  ctx.fillStyle=coat;ctx.beginPath();ctx.moveTo(-80,10);ctx.quadraticCurveTo(-180,30,-195,330);ctx.quadraticCurveTo(0,380,195,330);ctx.quadraticCurveTo(180,30,80,10);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f5eee1';ctx.beginPath();ctx.moveTo(-48,4);ctx.lineTo(0,85);ctx.lineTo(48,4);ctx.lineTo(24,260);ctx.lineTo(0,280);ctx.lineTo(-24,260);ctx.closePath();ctx.fill();
  ctx.fillStyle='#c78c43';ctx.beginPath();ctx.moveTo(-15,90);ctx.lineTo(15,90);ctx.lineTo(8,210);ctx.lineTo(0,228);ctx.lineTo(-8,210);ctx.closePath();ctx.fill();
  // Tête et cou
  ctx.fillStyle='#a9694c';ctx.beginPath();ctx.roundRect(-34,-82,68,100,22);ctx.fill();
  const skin=ctx.createLinearGradient(-95,-350,95,-70);skin.addColorStop(0,'#d99a73');skin.addColorStop(.55,'#b97756');skin.addColorStop(1,'#804832');
  ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(-100,-220);ctx.quadraticCurveTo(-115,-330,-48,-350);ctx.quadraticCurveTo(50,-378,102,-300);ctx.lineTo(90,-150);ctx.quadraticCurveTo(70,-72,0,-70);ctx.quadraticCurveTo(-72,-78,-90,-150);ctx.closePath();ctx.fill();
  ctx.fillStyle='#172331';ctx.beginPath();ctx.moveTo(-103,-220);ctx.quadraticCurveTo(-128,-345,-34,-365);ctx.quadraticCurveTo(84,-384,111,-280);ctx.lineTo(91,-235);ctx.quadraticCurveTo(32,-294,-26,-252);ctx.quadraticCurveTo(-65,-225,-103,-220);ctx.fill();
  // Yeux, sourcils, bouche animée
  ctx.strokeStyle='#4a3027';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-68,-225);ctx.quadraticCurveTo(-42,-238,-20,-225);ctx.moveTo(20,-225);ctx.quadraticCurveTo(45,-238,68,-225);ctx.stroke();
  ctx.fillStyle='#f8eee3';ctx.beginPath();ctx.ellipse(-43,-195,19,12,0,0,Math.PI*2);ctx.ellipse(43,-195,19,12,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#30221d';ctx.beginPath();ctx.arc(-42,-195,7,0,Math.PI*2);ctx.arc(42,-195,7,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#754334';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-30,-122);ctx.quadraticCurveTo(0,-122+16*p,30,-122);ctx.stroke();
  // Bras animés et tablette
  const arm=ctx.createLinearGradient(-200,60,200,250);arm.addColorStop(0,'#315d83');arm.addColorStop(1,'#102a45');ctx.strokeStyle=arm;ctx.lineWidth=58;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-112,80);ctx.quadraticCurveTo(-205,160,-105,235);ctx.stroke();ctx.beginPath();ctx.moveTo(112,80);ctx.quadraticCurveTo(205,160,105,235);ctx.stroke();
  ctx.save();ctx.translate(0,160);ctx.rotate(-.035+Math.sin(t*1.8)*.018);roundedRect(ctx,-130,-72,260,155,12,'#fffaf0','#e7d7bd',2);roundedRect(ctx,-130,-72,260,27,8,'#173957');text(ctx,'GESTILYS',0,-56,{size:13,weight:900,color:'#fff',tracking:2});for(let i=0;i<3;i++)roundedRect(ctx,-92,-18+i*30,184-i*22,7,4,'#cbd3d9');ctx.restore();
  ctx.restore();
}
