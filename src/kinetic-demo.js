import {clamp,lerp,ease,easeOut,backOut,stagger,drift,withCamera,roundedRect,glow,text,drawDirector} from './kinetic-engine.js';
const W=1080,H=1920;
function background(c,t){const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#071a30');g.addColorStop(.55,'#081526');g.addColorStop(1,'#020812');c.fillStyle=g;c.fillRect(0,0,W,H);glow(c,540,720,760,'rgba(45,112,157,ALPHA)',.25+.05*Math.sin(t));}
function particles(c,t){for(let i=0;i<70;i++){const x=(i*173.7)%W,y=((i*317.3-t*(25+i%7*7))%2100+2100)%2100,r=1+(i%4)*.7;c.globalAlpha=.18+.28*(.5+.5*Math.sin(t*2+i));c.fillStyle=i%9===0?'#f4ca7d':'#c4d7e8';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}c.globalAlpha=1;}
function line(c,x1,y1,x2,y2,p,color='#e9bd6a',width=3){c.save();c.globalAlpha=clamp(p);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(x1,y1);c.lineTo(lerp(x1,x2,p),lerp(y1,y2,p));c.stroke();c.restore();}
function kineticWord(c,str,x,y,t,start,delay=0){const p=backOut((t-start-delay)/.5);if(p<=0)return;c.save();c.globalAlpha=clamp((t-start-delay)/.2);c.translate(x,y+(1-p)*100);c.rotate((1-p)*-.12);c.scale(.75+p*.25,.75+p*.25);text(c,str,0,0,{size:88,weight:900,color:'#fffaf0'});c.restore();}
function orbitCards(c,t){const labels=['ÉLÈVES','PAIEMENTS','BULLETINS'];labels.forEach((s,i)=>{const a=t*1.2+i*2.094,p=stagger(t,2.3,i,.12,.5),x=540+Math.cos(a)*300,y=930+Math.sin(a)*210; c.save();c.globalAlpha=p;c.translate(x,y);c.rotate(Math.sin(a)*.08);c.shadowColor='rgba(0,0,0,.35)';c.shadowBlur=32;roundedRect(c,-130,-55,260,110,18,'rgba(17,43,68,.94)','rgba(244,202,125,.8)',2);c.shadowBlur=0;text(c,s,0,0,{size:22,weight:850,color:'#f7d48f',tracking:2});c.restore();});}
function transitionWipe(c,t,center,duration=.42){const p=clamp((t-center)/duration);if(p<=0||p>=1)return;const x=lerp(-700,1800,easeInOut(p));c.save();c.globalAlpha=Math.sin(p*Math.PI)*.78;const g=c.createLinearGradient(x-240,0,x+240,0);g.addColorStop(0,'rgba(243,198,113,0)');g.addColorStop(.48,'rgba(243,198,113,.85)');g.addColorStop(1,'rgba(243,198,113,0)');c.fillStyle=g;c.beginPath();c.moveTo(x-300,0);c.lineTo(x+180,0);c.lineTo(x-420,H);c.lineTo(x-900,H);c.closePath();c.fill();c.restore();}
function easeInOut(t){t=clamp(t);return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
function scene(c,t){
 background(c,t);particles(c,t);
 if(t<3.1){
  const p=easeOut(t/.8);c.save();c.globalAlpha=p;for(let i=0;i<12;i++){const a=i*Math.PI/6+t*.22,r=lerp(520,340,p);line(c,540+Math.cos(a)*r,700+Math.sin(a)*r,540+Math.cos(a)*r*1.28,700+Math.sin(a)*r*1.28,p,'rgba(238,195,112,.7)',2);}c.restore();
  kineticWord(c,'DIRIGER',540,480,t,.35,0);kineticWord(c,'UNE ÉCOLE',540,590,t,.48,.12);kineticWord(c,'NE DEVRAIT PAS',540,700,t,.62,.24);
  const q=easeOut((t-1.25)/.6);c.save();c.globalAlpha=q;text(c,'VOUS ÉPUISER.',540,825,{size:92,weight:950,color:'#f3c778'});c.restore();
  drawDirector(c,t,ease((t-1.4)/1.2));
 }else if(t<6.5){
  const p=easeOut((t-3.1)/.7);c.save();c.globalAlpha=p;glow(c,540,950,430,'rgba(243,194,103,ALPHA)',.5);c.translate(540,940);c.rotate((1-p)*Math.PI);c.scale(.4+p*.6,.4+p*.6);c.strokeStyle='#f3ca82';c.lineWidth=5;c.beginPath();c.arc(0,0,235,0,Math.PI*2);c.stroke();c.restore();
  // Noyau central pulsant : le pilotage scolaire réuni dans un seul outil
  const pulse=1+Math.sin(t*3.2)*.035;c.save();c.translate(540,940);c.scale(pulse,pulse);glow(c,0,0,175,'rgba(243,194,103,ALPHA)',.42);c.fillStyle='#f1c77c';c.beginPath();c.arc(0,0,88,0,Math.PI*2);c.fill();text(c,'G',0,-4,{size:104,weight:950,color:'#102b45'});c.restore();
  orbitCards(c,t);const q=easeOut((t-4.05)/.5);c.save();c.globalAlpha=q;text(c,'TOUT AU MÊME',540,1390,{size:61,weight:900});text(c,'ENDROIT.',540,1470,{size:74,weight:950,color:'#f4ca7d'});c.restore();
 }else{
  const p=easeOut((t-6.15)/.7);c.save();c.globalAlpha=p;text(c,'GESTILYS',540,300,{size:104,weight:900,tracking:-3});text(c,'LA GESTION SCOLAIRE, SIMPLIFIÉE.',540,390,{size:25,weight:700,color:'#f2ca80',tracking:2});c.restore();
  // Interface construite en couches, avec profondeur et apparition séquencée
  const cards=[['ÉLÈVES & CLASSES','1 248'],['PAIEMENTS SUIVIS','86 %'],['BULLETINS','12']];cards.forEach((a,i)=>{const q=stagger(t,6.65,i,.16,.55),x=95+i*300,y=690+(1-q)*130;c.save();c.globalAlpha=q;c.translate(x,y);c.shadowColor='rgba(0,0,0,.35)';c.shadowBlur=28;roundedRect(c,0,0,275,230,18,'#f9fafb','#e4eaf0',2);c.shadowBlur=0;text(c,a[0],137,56,{size:16,weight:800,color:'#52677a'});text(c,a[1],137,137,{size:58,weight:900,color:'#142f4a'});roundedRect(c,25,185,225,8,4,'#e7edf1');roundedRect(c,25,185,225*(.42+i*.18),8,4,i===1?'#d6a653':'#6d99ad');c.restore();});
  const q=easeOut((t-7.75)/.55);c.save();c.globalAlpha=q;roundedRect(c,155,1040,770,350,24,'rgba(16,43,68,.95)','rgba(239,198,121,.65)',2);text(c,'UNE VISION CLAIRE.',540,1160,{size:48,weight:900});text(c,'MOINS DE DISPERSION. PLUS DE MAÎTRISE.',540,1250,{size:23,weight:700,color:'#f0c77d',tracking:1});c.restore();
  const cta=easeOut((t-9.1)/.5);c.save();c.globalAlpha=cta;roundedRect(c,200,1530,680,125,18,'#e7b960','#ffe4a7',2);text(c,'DEMANDEZ UNE DÉMONSTRATION',540,1592,{size:27,weight:950,color:'#13283d',tracking:1});c.restore();
 }
 // caméra respirante et vignette cinématique
}
export function renderKineticFrame(ctx,t){ctx.save();ctx.clearRect(0,0,W,H);scene(ctx,t);const v=ctx.createRadialGradient(540,900,500,540,900,1250);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.38)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);ctx.restore();}
export const DURATION=11;
