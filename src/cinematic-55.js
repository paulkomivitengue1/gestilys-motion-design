/* Gestilys — campagne cinématographique 55 s, format vertical 9:16 */
const W=1080,H=1920;
const GOLD='#D9A64E', LIGHT='#F8D58A', WHITE='#F8F6F0', NAVY='#071426';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const out=v=>1-Math.pow(1-clamp(v),4);
const lerp=(a,b,p)=>a+(b-a)*p;
const mix=(a,b,p)=>a+(b-a)*p;
function box(c,x,y,w,h,r,fill,stroke=null,sw=1){
  c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=sw;c.stroke();}
}
function label(c,s,x,y,size=28,color=WHITE,weight=700,align='left',spacing=0){
  c.save();c.font=weight+' '+size+'px "DM Sans",sans-serif';c.textAlign=align;c.textBaseline='alphabetic';c.fillStyle=color;
  c.fillText(s,x,y);c.restore();
}
function shadow(c,blur=24,color='rgba(0,0,0,.28)',y=14){c.shadowColor=color;c.shadowBlur=blur;c.shadowOffsetX=0;c.shadowOffsetY=y;}
function background(c,t,light=0.3){
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0B2037');g.addColorStop(.55,'#071629');g.addColorStop(1,'#020812');c.fillStyle=g;c.fillRect(0,0,W,H);
  const r=c.createRadialGradient(540,700,10,540,700,920);r.addColorStop(0,'rgba(60,104,140,'+(light+Math.sin(t*.7)*.025)+')');r.addColorStop(1,'rgba(2,8,15,0)');c.fillStyle=r;c.fillRect(0,0,W,H);
  const floor=c.createLinearGradient(0,1320,0,H);floor.addColorStop(0,'rgba(7,18,31,0)');floor.addColorStop(1,'rgba(0,0,0,.38)');c.fillStyle=floor;c.fillRect(0,1320,W,H);
}
function grain(c,t){
  c.save();c.globalAlpha=.035;c.fillStyle='#fff';
  for(let i=0;i<150;i++){const x=((i*197.3+t*17)%W),y=((i*311.7+t*11)%H);c.fillRect(x,y,1.5,1.5);}c.restore();
}
function beam(c,t,y=900){
  const p=clamp(t/1.1);if(!p||p>=1)return;c.save();c.globalAlpha=Math.sin(p*Math.PI)*.8;c.translate(lerp(-500,1550,p),y);c.rotate(-.22);const g=c.createLinearGradient(-350,0,350,0);g.addColorStop(0,'rgba(248,213,138,0)');g.addColorStop(.48,'rgba(248,213,138,.75)');g.addColorStop(.52,'rgba(255,249,224,.95)');g.addColorStop(1,'rgba(248,213,138,0)');c.fillStyle=g;c.fillRect(-350,-3,700,6);c.restore();
}
function title(c,eyebrow,lines,t,opts={}){
  const p=out((t-(opts.at||0))/.55);if(!p)return;c.save();c.globalAlpha=p;c.translate(0,(1-p)*34);
  label(c,eyebrow.toUpperCase(),540,opts.eyebrowY||230,17,LIGHT,800,'center',3.4);
  const size=opts.size||67,lh=opts.lineH||82,start=opts.y||350;
  lines.forEach((s,i)=>{const q=out((t-(opts.at||0)-.14-i*.12)/.42);c.save();c.globalAlpha=q;c.translate(0,(1-q)*24);label(c,s,540,start+i*lh,size,(opts.accent&&opts.accent.includes(i))?LIGHT:WHITE,850,'center',-.8);c.restore();});
  c.restore();
}
function drawLogo(c,x,y,size,progress=1){
  c.save();c.translate(x-size/2,y-size/2);c.scale(size/64,size/64);
  const grad=c.createLinearGradient(0,0,64,64);grad.addColorStop(0,'#1E3A8A');grad.addColorStop(1,'#1e2d6e');
  c.beginPath();c.moveTo(32,3);c.lineTo(57,13);c.lineTo(57,32);c.bezierCurveTo(57,49,45.5,57.5,32,61.5);c.bezierCurveTo(18.5,57.5,7,49,7,32);c.lineTo(7,13);c.closePath();shadow(c,8,'rgba(30,58,138,.28)',3);c.fillStyle=grad;c.fill();c.shadowColor='transparent';
  c.beginPath();c.moveTo(20,22);c.bezierCurveTo(24,19.5,28,19.5,32,21.5);c.bezierCurveTo(36,19.5,40,19.5,44,22);c.lineTo(44,40);c.bezierCurveTo(40,37.5,36,37.5,32,39.5);c.bezierCurveTo(28,37.5,24,37.5,20,40);c.closePath();c.fillStyle='#fff';c.fill();
  c.beginPath();c.moveTo(32,21.5);c.lineTo(32,39.5);c.strokeStyle='rgba(30,58,138,.5)';c.lineWidth=1.4;c.stroke();
  c.beginPath();c.moveTo(25.5,49);c.lineTo(30,53.5);c.lineTo(38,44.5);c.strokeStyle='rgba(217,119,6,'+progress+')';c.lineWidth=3.4;c.lineCap='round';c.lineJoin='round';c.stroke();c.restore();
}
/* Personnage éditorial 2D détaillé : directeur africain, expression animée et tenue professionnelle. */
function drawDirector(c,t,relief=0){
  const bob=Math.sin(t*3.2)*3,tension=1-relief;c.save();c.translate(540,1390+bob);
  const halo=c.createRadialGradient(0,65,35,0,65,360);halo.addColorStop(0,'rgba(217,166,78,.17)');halo.addColorStop(1,'rgba(217,166,78,0)');c.fillStyle=halo;c.beginPath();c.ellipse(0,80,310,390,0,0,Math.PI*2);c.fill();
  c.fillStyle='rgba(0,0,0,.30)';c.beginPath();c.ellipse(0,365,205,25,0,0,Math.PI*2);c.fill();
  const sleeve=c.createLinearGradient(-190,80,190,310);sleeve.addColorStop(0,'#315a83');sleeve.addColorStop(.48,'#183b61');sleeve.addColorStop(1,'#0d2745');c.lineCap='round';c.lineJoin='round';c.strokeStyle=sleeve;c.lineWidth=62;
  c.beginPath();c.moveTo(-105,95);c.bezierCurveTo(-192,125,-195,225,-122,258);c.stroke();c.beginPath();c.moveTo(105,95);c.bezierCurveTo(192,125,195,225,122,258);c.stroke();
  const jacket=c.createLinearGradient(-180,40,190,370);jacket.addColorStop(0,'#315d88');jacket.addColorStop(.35,'#1d4269');jacket.addColorStop(1,'#0b2440');
  c.beginPath();c.moveTo(-72,5);c.bezierCurveTo(-145,16,-177,68,-188,164);c.lineTo(-164,352);c.quadraticCurveTo(0,385,164,352);c.lineTo(188,164);c.bezierCurveTo(177,68,145,16,72,5);c.closePath();c.fillStyle=jacket;c.fill();
  c.strokeStyle='rgba(170,202,225,.30)';c.lineWidth=3;c.beginPath();c.moveTo(-151,112);c.quadraticCurveTo(-165,222,-145,337);c.moveTo(151,112);c.quadraticCurveTo(165,222,145,337);c.stroke();
  c.beginPath();c.moveTo(-48,9);c.lineTo(0,78);c.lineTo(48,9);c.lineTo(33,239);c.lineTo(0,272);c.lineTo(-33,239);c.closePath();c.fillStyle='#f6f1e8';c.fill();
  c.beginPath();c.moveTo(-70,15);c.lineTo(-22,104);c.lineTo(-42,178);c.lineTo(-105,67);c.closePath();c.fillStyle='#274d73';c.fill();
  c.beginPath();c.moveTo(70,15);c.lineTo(22,104);c.lineTo(42,178);c.lineTo(105,67);c.closePath();c.fillStyle='#183958';c.fill();
  c.beginPath();c.moveTo(-15,88);c.lineTo(0,108);c.lineTo(15,88);c.lineTo(9,224);c.lineTo(0,241);c.lineTo(-9,224);c.closePath();c.fillStyle='#c98536';c.fill();
  const neck=c.createLinearGradient(-35,-55,38,5);neck.addColorStop(0,'#7d4635');neck.addColorStop(.5,'#b97856');neck.addColorStop(1,'#75402f');c.fillStyle=neck;c.beginPath();c.roundRect(-35,-65,70,112,22);c.fill();
  const skin=c.createLinearGradient(-105,-320,100,-70);skin.addColorStop(0,'#d99a72');skin.addColorStop(.38,'#bd805c');skin.addColorStop(.76,'#9b6046');skin.addColorStop(1,'#75412f');
  c.beginPath();c.moveTo(-100,-222);c.quadraticCurveTo(-111,-302,-56,-329);c.quadraticCurveTo(0,-354,57,-326);c.quadraticCurveTo(111,-292,101,-205);c.lineTo(88,-142);c.quadraticCurveTo(70,-82,0,-73);c.quadraticCurveTo(-70,-82,-88,-142);c.closePath();c.fillStyle=skin;c.fill();
  c.fillStyle='rgba(235,164,125,.22)';c.beginPath();c.ellipse(-62,-165,27,18,0,0,Math.PI*2);c.ellipse(62,-165,27,18,0,0,Math.PI*2);c.fill();
  c.fillStyle='#a9684c';c.beginPath();c.ellipse(-101,-184,17,27,-.12,0,Math.PI*2);c.ellipse(101,-184,17,27,.12,0,Math.PI*2);c.fill();
  c.fillStyle='#d18b65';c.beginPath();c.ellipse(-101,-184,8,15,0,0,Math.PI*2);c.ellipse(101,-184,8,15,0,0,Math.PI*2);c.fill();
  c.fillStyle='#172231';c.beginPath();c.moveTo(-103,-208);c.bezierCurveTo(-128,-283,-94,-347,-25,-350);c.bezierCurveTo(48,-367,111,-326,109,-249);c.lineTo(94,-218);c.quadraticCurveTo(68,-259,28,-263);c.quadraticCurveTo(-18,-278,-54,-246);c.quadraticCurveTo(-79,-224,-103,-208);c.closePath();c.fill();
  c.strokeStyle='rgba(112,132,148,.35)';c.lineWidth=4;for(let i=0;i<7;i++){c.beginPath();c.moveTo(-76+i*22,-290-(i%2)*9);c.quadraticCurveTo(-44+i*19,-329-(i%3)*5,-17+i*19,-320);c.stroke();}
  const brow=mix(9,-2,relief);c.strokeStyle='#4b3026';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(-68,-231+brow);c.quadraticCurveTo(-45,-242+brow,-23,-229-brow);c.moveTo(23,-229-brow);c.quadraticCurveTo(45,-242,68,-231+brow);c.stroke();
  const blink=(Math.abs(Math.sin(t*1.12))>.992)?1.5:1;c.fillStyle='#f8eee3';c.beginPath();c.ellipse(-43,-198,19,12*blink,0,0,Math.PI*2);c.ellipse(43,-198,19,12*blink,0,0,Math.PI*2);c.fill();
  c.fillStyle='#34231d';c.beginPath();c.arc(-41,-198,7,0,Math.PI*2);c.arc(41,-198,7,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(-43,-201,2.5,0,Math.PI*2);c.arc(39,-201,2.5,0,Math.PI*2);c.fill();
  c.strokeStyle='rgba(104,57,42,.62)';c.lineWidth=4;c.beginPath();c.moveTo(0,-190);c.quadraticCurveTo(-8,-155,1,-151);c.quadraticCurveTo(10,-146,18,-153);c.stroke();
  c.strokeStyle='#754334';c.lineWidth=6;c.beginPath();c.moveTo(-31,-126);c.quadraticCurveTo(0,-126+mix(-8,15,relief)+Math.sin(t*2.1)*1.5,31,-126);c.stroke();
  c.strokeStyle='rgba(245,194,157,.5)';c.lineWidth=2;c.beginPath();c.moveTo(-17,-116);c.quadraticCurveTo(0,-111+relief*4,17,-116);c.stroke();
  c.save();c.translate(0,119);c.rotate(-.045*tension);shadow(c,20,'rgba(0,0,0,.22)',10);box(c,-116,-68,232,145,10,'#fffaf0','#e4d6bd',2);c.shadowColor='transparent';box(c,-116,-68,232,25,8,'#1c3d60');c.fillStyle='#1c3d60';c.fillRect(-116,-53,232,10);label(c,'DOSSIER DE DIRECTION',0,-26,12,'#263d52',850,'center',.8);for(let i=0;i<3;i++)box(c,-83,0+i*23,166-i*18,6,3,'#c4cdd4');c.fillStyle='#d59d48';c.beginPath();c.arc(83,50,13,0,Math.PI*2);c.fill();c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.moveTo(77,50);c.lineTo(82,55);c.lineTo(90,44);c.stroke();c.restore();
  const hand=c.createLinearGradient(0,220,0,290);hand.addColorStop(0,'#c48763');hand.addColorStop(1,'#965b43');c.fillStyle=hand;c.beginPath();c.ellipse(-103,190,24,34,-.35,0,Math.PI*2);c.ellipse(103,190,24,34,.35,0,Math.PI*2);c.fill();c.restore();
}
function tag(c,s,x,y,t,at,rot=0){
  const p=out((t-at)/.5);if(!p)return;c.save();c.globalAlpha=p;c.translate(x,y+(1-p)*34);c.rotate(rot);shadow(c,26,'rgba(0,0,0,.28)',12);box(c,-145,-31,290,62,8,'rgba(15,39,62,.95)','rgba(248,213,138,.42)',1.3);c.shadowColor='transparent';label(c,s,0,8,17,LIGHT,800,'center',1.4);c.restore();
}
function office(c,t){
  background(c,t,.34);
  // Baie vitrée et profondeur de bureau
  box(c,74,270,932,690,18,'rgba(8,24,41,.7)','rgba(197,218,233,.18)',2);
  c.save();c.beginPath();c.roundRect(84,280,912,670,12);c.clip();
  const sky=c.createLinearGradient(0,280,0,950);sky.addColorStop(0,'#203c56');sky.addColorStop(1,'#0a1b2c');c.fillStyle=sky;c.fillRect(84,280,912,670);
  for(let i=0;i<9;i++){const x=105+i*112,h=180+(i*67)%300;box(c,x,950-h,72,h,3,'#10283d');for(let j=0;j<4;j++)for(let k=0;k<3;k++){c.fillStyle='rgba(236,195,117,'+(.1+((i+j+k)%3)*.04)+')';c.fillRect(x+10+j*14,950-h+18+k*22,6,9);}}
  c.fillStyle='rgba(245,206,135,.13)';c.fillRect(84,790,912,160);c.restore();
  // Bureau au premier plan
  const desk=c.createLinearGradient(0,1180,0,1430);desk.addColorStop(0,'#29445b');desk.addColorStop(1,'#0d2032');c.fillStyle=desk;c.beginPath();c.moveTo(0,1190);c.lineTo(1080,1190);c.lineTo(1080,1500);c.lineTo(0,1500);c.closePath();c.fill();
  c.fillStyle='rgba(255,255,255,.12)';c.fillRect(0,1190,1080,3);
  box(c,80,1080,230,112,10,'#f4f0e6','#d9d2c6',2);label(c,'DOSSIERS',195,1128,18,'#344a5e',850,'center',2);for(let i=0;i<3;i++)box(c,112,1144+i*12,160,4,2,'#c8d0d6');
  box(c,770,1080,220,110,10,'#132c44','#45627b',2);label(c,'GESTILYS',880,1143,18,'#f5d58e',850,'center',2);
}
function paper(c,x,y,rot,s,t,at){
  const p=out((t-at)/.5);if(!p)return;c.save();c.globalAlpha=p;c.translate(x,y+(1-p)*-80);c.rotate(rot);shadow(c,22,'rgba(0,0,0,.28)',14);box(c,-115,-145,230,290,5,'#f7f5ef','#d9e0e6',1);c.shadowColor='transparent';box(c,-115,-145,230,34,4,s==0?'#1b3c5c':'#c99a4b');label(c,s==0?'LISTE DE CLASSE':s==1?'SUIVI SCOLARITÉ':s==2?'NOTES & RÉSULTATS':'ÉQUIPE ENSEIGNANTE',0,-83,14,'#23384c',850,'center',.5);for(let i=0;i<6;i++){box(c,-83,-43+i*29,166-(i%3)*24,5,2,'#d5dce1');}c.restore();
}
function sceneIntro(c,t,cfg){
  office(c,t);drawDirector(c,t,.04);
  title(c,'GESTION D’ÉTABLISSEMENT', ['DIRIGER UNE ÉCOLE,','C’EST BIEN PLUS QUE','GÉRER DES ÉLÈVES.'],t,{at:.15,y:380,size:59,lineH:76,accent:[2]});
  tag(c,'COORDONNER',170,780,t,.35,-.08);tag(c,'ORGANISER',885,780,t,.8,.07);tag(c,'DÉCIDER',540,690,t,1.2,0);
  const p=out((t-4.4)/.55);if(p){c.save();c.globalAlpha=p;label(c,'Chaque jour, plusieurs responsabilités.',540,890,25,'rgba(241,245,248,.84)',600,'center');c.restore();}
  beam(c,t,1440);
}
function sceneChallenge(c,t,cfg){
  background(c,t,.22);title(c,'LE QUOTIDIEN D’UN DIRECTEUR',['PLUSIEURS SUJETS.','UNE MÊME JOURNÉE.'],t,{at:.1,y:310,size:69,lineH:90,accent:[1]});
  paper(c,250,760,-.13,0,t,.3);paper(c,820,790,.12,1,t,.65);paper(c,270,1220,.09,2,t,1.0);paper(c,820,1220,-.1,3,t,1.35);
  const p=out((t-2.1)/.55);if(p){c.save();c.globalAlpha=p;box(c,130,1510,820,150,14,'rgba(15,39,62,.9)','rgba(248,213,138,.35)',1);label(c,'RETROUVER LA BONNE INFORMATION',540,1570,24,WHITE,800,'center',1.2);label(c,'NE DEVRAIT PAS PRENDRE TOUTE LA JOURNÉE.',540,1615,18,LIGHT,700,'center',.6);c.restore();}
  const q=out((t-5.2)/.55);if(q){c.save();c.globalAlpha=q;label(c,'ET SI TOUT DEVENAIT PLUS SIMPLE ?',540,1760,25,LIGHT,850,'center',1.4);c.restore();}
}
function sceneReveal(c,t,cfg){
  background(c,t,.48);const p=out((t-.15)/.85);c.save();c.globalAlpha=p;const halo=c.createRadialGradient(540,770,8,540,770,510);halo.addColorStop(0,'rgba(248,213,138,.32)');halo.addColorStop(1,'rgba(248,213,138,0)');c.fillStyle=halo;c.fillRect(0,250,W,1050);
  for(let i=0;i<7;i++){c.save();c.translate(540,790);c.rotate(t*.04+i*Math.PI/7);const g=c.createLinearGradient(0,-300,0,-620);g.addColorStop(0,'rgba(248,213,138,.22)');g.addColorStop(1,'rgba(248,213,138,0)');c.fillStyle=g;c.fillRect(-2,-620,4,330);c.restore();}
  const scale=.72+.28*out((t-.4)/.7);drawLogo(c,540,740,220*scale,p);c.restore();
  const n=out((t-1.05)/.65);if(n){c.save();c.globalAlpha=n;label(c,'GESTILYS',540,1030,116,WHITE,900,'center',-4);c.restore();}
  const q=out((t-1.8)/.55);if(q){c.save();c.globalAlpha=q;box(c,205,1110,670,2,1,'rgba(248,213,138,.85)');label(c,'LA GESTION SCOLAIRE, SIMPLIFIÉE.',540,1200,29,LIGHT,750,'center',1.7);c.restore();}
  const z=out((t-3.1)/.55);if(z){c.save();c.globalAlpha=z;label(c,'UNE NOUVELLE FAÇON DE PILOTER VOTRE ÉTABLISSEMENT.',540,1450,18,'rgba(232,240,246,.66)',650,'center',1.1);c.restore();}
  beam(c,t,1620);
}
function uiFrame(c,x,y,w,h,titleText,t,sub='ÉCRAN ILLUSTRATIF'){
  const p=out((t-.12)/.65);c.save();c.globalAlpha=p;c.translate(0,(1-p)*45);shadow(c,44,'rgba(0,0,0,.34)',26);box(c,x,y,w,h,22,'#f8fafc','#fff',1.5);c.shadowColor='transparent';
  box(c,x,y,w,86,20,'#102941');c.fillStyle='#102941';c.fillRect(x,y+64,w,22);drawLogo(c,x+53,y+43,40,1);label(c,'GESTILYS',x+87,y+51,19,'#fff',850,'left',1.3);label(c,titleText,x+245,y+53,18,'rgba(255,255,255,.92)',700);
  box(c,x+w-208,y+22,178,42,9,'rgba(255,255,255,.1)','rgba(255,255,255,.18)',1);label(c,'RECHERCHER',x+w-119,y+49,11,'rgba(255,255,255,.65)',650,'center',1);
  box(c,x+18,y+105,150,h-128,12,'#eaf0f5');const nav=['Vue d’ensemble','Élèves','Enseignants','Paiements','Bulletins'];nav.forEach((s,i)=>{const yy=y+151+i*78;if(s===titleText)box(c,x+28,yy-27,130,49,8,'#193c5b');label(c,s,x+42,yy+4,13,s===titleText?'#fff':'#64778a',750);});
  label(c,sub,x+w-24,y+h-22,10,'#7d8d9b',750,'right',1.4);c.restore();
}
function sceneStudents(c,t,cfg){
  background(c,t,.26);title(c,'FONCTIONNALITÉ 01',['LES ÉLÈVES,','CLASSE PAR CLASSE.'],t,{at:.05,y:300,size:70,lineH:86,accent:[1]});
  uiFrame(c,65,520,950,1000,'Élèves',t,'ÉCRANS ILLUSTRATIFS · DONNÉES FICTIVES');
  const p=out((t-.75)/.5);if(p){c.save();c.globalAlpha=p;const x=260,y=665;box(c,x,y,700,92,10,'#fff','#e2e8ee',1);label(c,'LISTE DES ÉLÈVES',x+25,y+35,15,'#20384f',850,'left',.7);label(c,'Nom · Prénom',x+25,y+68,12,'#7a8996',700);label(c,'Classe',x+505,y+68,12,'#7a8996',700);label(c,'Matricule',x+620,y+68,12,'#7a8996',700);
  const rows=[['Aminata Traoré','CM2 · A','EL-024'],['Moussa Keïta','6e · B','EL-031'],['Fatoumata Diarra','CE1 · A','EL-042'],['Ibrahim Coulibaly','5e · A','EL-056']];
  rows.forEach((r,i)=>{const yy=y+115+i*135;box(c,x,yy,700,112,9,'#fff','#e9edf1',1);c.beginPath();c.arc(x+35,yy+55,20,0,Math.PI*2);c.fillStyle=['#dce8ef','#f4e6c8','#e0ece4','#e2e7f1'][i];c.fill();label(c,r[0].split(' ').map(v=>v[0]).join(''),x+35,yy+61,12,'#314c64',850,'center');label(c,r[0],x+75,yy+48,17,'#2c4155',800);label(c,r[1],x+505,yy+57,15,'#5e7080',700);label(c,r[2],x+620,yy+57,14,'#82909b',650);});c.restore();}
  beam(c,t,1700);
}
function sceneTeachers(c,t,cfg){
  background(c,t,.27);title(c,'FONCTIONNALITÉ 02',['UNE ÉQUIPE','MIEUX ORGANISÉE.'],t,{at:.05,y:300,size:70,lineH:86,accent:[1]});
  uiFrame(c,65,520,950,1000,'Enseignants',t,'ÉCRANS ILLUSTRATIFS · DONNÉES FICTIVES');
  const p=out((t-.75)/.5);if(p){c.save();c.globalAlpha=p;const x=260,y=665;label(c,'ÉQUIPE ENSEIGNANTE',x+10,y+32,16,'#20384f',850);label(c,'ENSEIGNANT',x+15,y+92,12,'#7a8996',750);label(c,'MATIÈRE',x+430,y+92,12,'#7a8996',750);label(c,'CLASSE',x+600,y+92,12,'#7a8996',750);
  const rows=[['M. Diallo','Mathématiques','Terminale'],['Mme Traoré','Français','3e · A'],['M. Keïta','Physique','2nde · B'],['Mme Coulibaly','SVT','1re · A']];
  rows.forEach((r,i)=>{const yy=y+125+i*143;box(c,x,yy,700,112,10,'#fff','#e7edf1',1);c.beginPath();c.arc(x+37,yy+55,22,0,Math.PI*2);c.fillStyle=['#dce8ef','#f4e6c8','#e0ece4','#e2e7f1'][i];c.fill();label(c,r[0].split(' ').map(v=>v[0]).join(''),x+37,yy+60,12,'#314c64',850,'center');label(c,r[0],x+80,yy+50,17,'#2c4155',800);label(c,r[1],x+430,yy+50,15,'#5e7080',700);label(c,r[2],x+600,yy+50,14,'#82909b',650);});c.restore();}
  beam(c,t,1700);
}
function scenePayments(c,t,cfg){
  background(c,t,.26);title(c,'FONCTIONNALITÉ 03',['SUIVEZ LES','PAIEMENTS SCOLAIRES.'],t,{at:.05,y:300,size:70,lineH:86,accent:[1]});
  uiFrame(c,65,520,950,1000,'Paiements',t,'ÉCRANS ILLUSTRATIFS · DONNÉES FICTIVES');
  const p=out((t-.75)/.5);if(p){c.save();c.globalAlpha=p;const x=260,y=665;box(c,x,y,700,140,12,'#fff','#e3e9ef',1);label(c,'SUIVI DE LA SCOLARITÉ',x+25,y+42,17,'#20384f',850);label(c,'Consultez les paiements par élève et par échéance.',x+25,y+79,13,'#7a8996',600);box(c,x+25,y+104,640,9,5,'#e9eef2');box(c,x+25,y+104,390,9,5,'#d5a34e');
  const rows=[['Aminata Traoré','1re tranche','À jour'],['Moussa Keïta','2e tranche','À suivre'],['Fatoumata Diarra','1re tranche','En attente'],['Ibrahim Coulibaly','3e tranche','À jour']];
  rows.forEach((r,i)=>{const yy=y+175+i*135;box(c,x,yy,700,112,10,'#fff','#e7edf1',1);label(c,r[0],x+25,yy+45,16,'#2c4155',800);label(c,r[1],x+355,yy+45,14,'#697c8b',700);const col=r[2]==='À jour'?'#dceee3':r[2]==='À suivre'?'#f8eed7':'#f4e2df';box(c,x+545,yy+27,130,43,8,col);label(c,r[2],x+610,yy+54,13,r[2]==='À jour'?'#397452':r[2]==='À suivre'?'#9a702c':'#a45c4f',800,'center');});c.restore();}
  beam(c,t,1700);
}
function sceneBulletins(c,t,cfg){
  background(c,t,.28);title(c,'FONCTIONNALITÉ 04',['LES RÉSULTATS,','EN TOUTE CLARTÉ.'],t,{at:.05,y:300,size:70,lineH:86,accent:[1]});
  uiFrame(c,65,520,950,1000,'Bulletins',t,'ÉCRANS ILLUSTRATIFS · DONNÉES FICTIVES');
  const p=out((t-.75)/.5);if(p){c.save();c.globalAlpha=p;const x=260,y=665;box(c,x,y,700,685,12,'#fff','#e3e9ef',1);label(c,'BULLETIN SCOLAIRE',x+28,y+45,18,'#20384f',850);label(c,'ÉLÈVE : Aminata Traoré',x+28,y+82,13,'#7a8996',700);label(c,'CLASSE : CM2 · A',x+460,y+82,13,'#7a8996',700);
  const subjects=['Mathématiques','Français','Sciences','Histoire-Géographie'];subjects.forEach((s,i)=>{const yy=y+145+i*93;box(c,x+22,yy,656,73,8,'#f7f9fb','#edf0f3',1);label(c,s,x+43,yy+43,16,'#344a5e',750);box(c,x+370,yy+31,180,9,5,'#e4eaf0');box(c,x+370,yy+31,90+(i%3)*28,9,5,i%2?'#7c9db0':'#d5a34e');label(c,'— / 20',x+630,yy+43,14,'#667b8c',750,'right');});
  box(c,x+22,y+540,656,105,9,'#f7f4ec','#eadfc9',1);label(c,'MOYENNE GÉNÉRALE',x+43,y+580,13,'#8b774f',850);label(c,'APPRÉCIATION',x+43,y+615,15,'#354b60',800);label(c,'Appréciation de l’enseignant',x+630,y+615,12,'#7c8994',600,'right');c.restore();}
  beam(c,t,1700);
}
function sceneOverview(c,t,cfg){
  background(c,t,.33);title(c,'PILOTAGE DE L’ÉTABLISSEMENT',['UNE VUE D’ENSEMBLE.','LES BONNES INFORMATIONS.'],t,{at:.05,y:300,size:64,lineH:82,accent:[1]});
  const items=[['ÉLÈVES','Informations et classes'],['ENSEIGNANTS','Organisation de l’équipe'],['PAIEMENTS','Suivi de la scolarité'],['BULLETINS','Résultats scolaires']];
  items.forEach((a,i)=>{const p=out((t-.45-i*.14)/.55);if(!p)return;const x=95+(i%2)*455,y=650+Math.floor(i/2)*360;c.save();c.globalAlpha=p;c.translate(0,(1-p)*55);shadow(c,30,'rgba(0,0,0,.28)',18);box(c,x,y,430,300,18,'#f8fafc','#fff',1.2);c.shadowColor='transparent';box(c,x+26,y+27,64,64,14,i===0?'#e3edf4':i===1?'#e8f0e8':i===2?'#f6ecd8':'#e8e9f4');label(c,String(i+1).padStart(2,'0'),x+58,y+69,20,'#294b66',850,'center');label(c,a[0],x+27,y+160,24,'#1e3449',850);label(c,a[1],x+27,y+207,15,'#6d7e8d',650);box(c,x+27,y+245,374,2,1,'#e3e9ee');c.restore();});
  const p=out((t-2.1)/.5);if(p){c.save();c.globalAlpha=p;label(c,'LES PRINCIPALES FONCTIONS, DANS UN MÊME ESPACE.',540,1515,19,LIGHT,750,'center',1.5);c.restore();}
}
function sceneResult(c,t,cfg){
  background(c,t,.38);title(c,'LE BÉNÉFICE AU QUOTIDIEN',['MOINS DE DISPERSION.','PLUS DE CLARTÉ.'],t,{at:.05,y:280,size:68,lineH:88,accent:[1]});
  const cards=[['ÉLÈVES','Informations organisées'],['PAIEMENTS','Suivi plus lisible'],['BULLETINS','Résultats accessibles']];
  cards.forEach((a,i)=>{const p=out((t-.35-i*.16)/.5);if(!p)return;const x=90+i*305,y=660;c.save();c.globalAlpha=p;c.translate(0,(1-p)*28);shadow(c,25,'rgba(0,0,0,.25)',12);box(c,x,y,280,205,14,'rgba(248,250,252,.97)','#fff',1);c.shadowColor='transparent';label(c,a[0],x+20,y+65,17,'#20384f',850);label(c,a[1],x+20,y+112,13,'#6c7e8d',650);box(c,x+20,y+158,240,4,2,'#e5ebef');box(c,x+20,y+158,160+i*22,4,2,GOLD);c.restore();});
  c.save();c.translate(0,65);c.scale(.92,.92);drawDirector(c,t,1);c.restore();
  const p=out((t-4.8)/.5);if(p){c.save();c.globalAlpha=p;label(c,'PILOTEZ VOTRE ÉTABLISSEMENT AVEC PLUS DE SÉRÉNITÉ.',540,1780,19,'rgba(235,242,247,.82)',700,'center',.8);c.restore();}
}
function sceneEnd(c,t,cfg){
  background(c,t,.46);const p=out((t-.08)/.65);c.save();c.globalAlpha=p;const halo=c.createRadialGradient(540,650,20,540,650,580);halo.addColorStop(0,'rgba(248,213,138,.24)');halo.addColorStop(1,'rgba(248,213,138,0)');c.fillStyle=halo;c.fillRect(0,180,W,1050);drawLogo(c,540,610,200,p);c.restore();
  const n=out((t-.65)/.55);if(n){c.save();c.globalAlpha=n;label(c,'GESTILYS',540,900,112,WHITE,900,'center',-4);c.restore();}
  const q=out((t-1.1)/.5);if(q){c.save();c.globalAlpha=q;label(c,'LA GESTION SCOLAIRE, SIMPLIFIÉE.',540,1020,31,LIGHT,750,'center',1.3);c.restore();}
  const b=out((t-2.0)/.5);if(b){c.save();c.globalAlpha=b;box(c,155,1220,770,118,14,'#e6bd6e','#ffe4a7',1.3);label(c,'DÉCOUVREZ GESTILYS',540,1292,29,'#13283d',900,'center',1.7);label(c,'Faites évoluer la gestion de votre établissement.',540,1460,21,WHITE,650,'center',.2);box(c,250,1570,580,2,1,'rgba(248,213,138,.72)');label(c,'SITE WEB  ·  CONTACT',540,1625,13,'rgba(232,240,246,.55)',700,'center',2.5);c.restore();}
  const tail=clamp((t-3.4)/.6);if(tail){c.save();c.globalAlpha=tail*.12;c.fillStyle='#fff';c.fillRect(0,0,W,H);c.restore();}
}
const SCENES=[
  {start:0,end:8,draw:sceneIntro},
  {start:8,end:15,draw:sceneChallenge},
  {start:15,end:23,draw:sceneReveal},
  {start:23,end:28,draw:sceneStudents},
  {start:28,end:33,draw:sceneTeachers},
  {start:33,end:38,draw:scenePayments},
  {start:38,end:43,draw:sceneBulletins},
  {start:43,end:47,draw:sceneOverview},
  {start:47,end:51,draw:sceneResult},
  {start:51,end:55,draw:sceneEnd}
];
export function renderCinematicFrame(ctx,t,cfg={}){
  ctx.save();ctx.clearRect(0,0,W,H);let active=false;
  for(let i=0;i<SCENES.length;i++){
    const s=SCENES[i];if(t<s.start-.32||t>s.end+.32)continue;
    const fadeIn=i===0?1:smooth((t-s.start+.32)/.32);
    const fadeOut=i===SCENES.length-1?1:1-smooth((t-s.end+.32)/.32);
    const a=fadeIn*fadeOut;if(a<=.001)continue;
    ctx.save();ctx.globalAlpha=a;s.draw(ctx,t-s.start,cfg);ctx.restore();active=true;
  }
  if(!active)background(ctx,t);
  const v=ctx.createRadialGradient(540,900,470,540,900,1260);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(.72,'rgba(0,0,0,.05)');v.addColorStop(1,'rgba(0,0,0,.34)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  grain(ctx,t);ctx.restore();
}
export const VIDEO={width:W,height:H,fps:30,duration:55};
