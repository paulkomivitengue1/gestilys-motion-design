/* Motion engine Gestilys — dessin Canvas 2D, déterministe et synchronisable à l'image.
 * Pas de vidéo stock, de capture de navigateur ou de dépendance à une API distante.
 */
const W = 1080, H = 1920;
let GOLD = '#D9A64E', LIGHT = '#F8D58A', PAPER = '#F6F2E8', WHITE = '#F8F6F0';
const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
const smooth = x => { x=clamp(x); return x*x*(3-2*x); };
const out = x => 1-Math.pow(1-clamp(x),4);
const fract = x => x-Math.floor(x);
const seeded = n => fract(Math.sin(n*127.1+311.7)*43758.5453123);
const mix = (a,b,t) => a+(b-a)*t;

function roundPath(c,x,y,w,h,r) {
  r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath();
}
function box(c,x,y,w,h,r,fill,stroke,sw=1) {
  roundPath(c,x,y,w,h,r); if(fill){c.fillStyle=fill;c.fill();} if(stroke){c.lineWidth=sw;c.strokeStyle=stroke;c.stroke();}
}
function label(c,str,x,y,size=26,color=WHITE,weight=600,align='left',spacing=0,font='DM Sans') {
  c.save();c.font=`${weight} ${size}px "${font}", sans-serif`;c.textAlign=align;c.textBaseline='alphabetic';c.fillStyle=color;
  if(spacing){const chars=[...str];const width=chars.reduce((s,ch)=>s+c.measureText(ch).width,0)+spacing*(chars.length-1);let px=x-(align==='center'?width/2:align==='right'?width:0);for(const ch of chars){c.fillText(ch,px,y);px+=c.measureText(ch).width+spacing;}}
  else c.fillText(str,x,y);c.restore();
}
function shadow(c,blur=28,color='rgba(0,0,0,.36)',y=18){c.shadowColor=color;c.shadowBlur=blur;c.shadowOffsetX=0;c.shadowOffsetY=y;}
function bg(c,t,centerY=690,glow=.27) {
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0B1D32');g.addColorStop(.48,'#091829');g.addColorStop(1,'#030A15');c.fillStyle=g;c.fillRect(0,0,W,H);
  const r=c.createRadialGradient(540,centerY,20,540,centerY,900);r.addColorStop(0,`rgba(46,82,112,${glow})`);r.addColorStop(.48,'rgba(19,45,70,.15)');r.addColorStop(1,'rgba(2,8,15,0)');c.fillStyle=r;c.fillRect(0,0,W,H);
  const gx=c.createRadialGradient(540,centerY,0,540,centerY,310);gx.addColorStop(0,`rgba(217,166,78,${.06+Math.sin(t*1.2)*.022})`);gx.addColorStop(1,'rgba(217,166,78,0)');c.fillStyle=gx;c.fillRect(0,0,W,H);
}
function particleField(c,t,seed,count=36,maxY=1780) {
  for(let i=0;i<count;i++){
    const x=seeded(seed+i*3.7)*W, base=seeded(seed+i*5.3)*maxY, speed=17+seeded(seed+i*7.1)*51;
    let y=(base-t*speed+maxY*2)%(maxY+100), r=1+seeded(seed+i*9.9)*3.2;
    const blink=.2+.46*(.5+.5*Math.sin(t*(1.2+seeded(i+seed)*1.5)+i));
    c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=i%8===0?`rgba(248,213,138,${blink})`:`rgba(219,232,242,${blink*.66})`;c.fill();
    if(i%8===0){c.beginPath();c.arc(x,y,r*4,0,Math.PI*2);const g=c.createRadialGradient(x,y,0,x,y,r*4);g.addColorStop(0,`rgba(248,213,138,${blink*.24})`);g.addColorStop(1,'rgba(248,213,138,0)');c.fillStyle=g;c.fill();}
  }
}
function grid(c,t,y0=1140) {
  c.save();c.globalAlpha=.22;c.lineWidth=1;
  for(let i=0;i<13;i++){
    const y=y0+Math.pow(i/12,1.65)*650;
    c.strokeStyle=`rgba(180,203,222,${.19-i*.009})`;c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();
  }
  for(let i=0;i<=12;i++){
    const x=i*90;c.strokeStyle='rgba(180,203,222,.14)';c.beginPath();c.moveTo(540+(x-540)*.12,y0);c.lineTo(x,H);c.stroke();
  }
  c.restore();
}
function rings(c,x,y,r,t,alpha=.7) {
  c.save();c.translate(x,y);
  [r,r*.82,r*.58].forEach((rr,i)=>{
    c.beginPath();c.ellipse(0,0,rr,rr*(i===1?.975:.93),t*.06*(i%2?1:-1),-.45+i*.55,Math.PI*1.55+i*.4);
    c.strokeStyle=i===0?`rgba(248,213,138,${alpha*.34})`:`rgba(226,237,245,${alpha*(i===1?.13:.22)})`;c.lineWidth=i===0?2:1.4;c.setLineDash(i===1?[4,18]:i===2?[2,10]:[]);c.stroke();c.setLineDash([]);
    const a=t*.38+i*2.1;const px=Math.cos(a)*rr,py=Math.sin(a)*rr*.94;c.beginPath();c.arc(px,py,i===0?4:2.7,0,Math.PI*2);c.fillStyle=i===0?LIGHT:'rgba(240,245,248,.74)';c.shadowBlur=16;c.shadowColor=LIGHT;c.fill();c.shadowBlur=0;
  });c.restore();
}
function topLabel(c,text,t,at=0) {
  const p=out((t-at)/.48);if(!p)return;
  c.save();c.globalAlpha=p;c.fillStyle=LIGHT;c.shadowColor=GOLD;c.shadowBlur=14;c.beginPath();c.arc(96,145,6,0,Math.PI*2);c.fill();c.shadowBlur=0;
  label(c,text,116,153,20,'rgba(239,241,239,.72)',700,'left',4);c.restore();
}
function wordLines(c,lines,t,at,opts={}) {
  const size=opts.size||78, lineH=opts.lineH||108, y=opts.y||800, accent=opts.accent||[], step=opts.step||.105;
  lines.forEach((line,row)=>{
    const words=line.split(' ');c.save();c.font=`${opts.weight||800} ${size}px "DM Sans", sans-serif`;
    const gap=opts.gap===undefined?size*.23:opts.gap;let widths=words.map(w=>c.measureText(w).width),total=widths.reduce((a,b)=>a+b,0)+gap*(words.length-1);let x=(W-total)/2;
    words.forEach((word,i)=>{
      const idx=lines.slice(0,row).reduce((n,l)=>n+l.split(' ').length,0)+i;
      const p=out((t-at-idx*step)/.34);if(p>0){c.save();c.globalAlpha=p;c.translate(x+widths[i]/2,y+row*lineH+(1-p)*55);c.scale(.94+p*.06,.94+p*.06);
        const hot=accent.some(a=>word.toUpperCase().includes(a));c.fillStyle=hot?LIGHT:WHITE;c.textAlign='center';c.textBaseline='alphabetic';
        c.shadowColor=hot?'rgba(248,213,138,.38)':'rgba(0,0,0,.25)';c.shadowBlur=hot?28:10;c.fillText(word,0,0);c.restore();}
      x+=widths[i]+gap;
    });c.restore();
  });
}
function beam(c,y,t,at,dur=1) {
  const p=(t-at)/dur;if(p<0||p>1)return;const a=p<.48?p/.48:(1-p)/.52;
  const x=mix(-550,1150,p);c.save();c.globalAlpha=clamp(a)*.9;c.translate(x,y);c.rotate(-.24);const g=c.createLinearGradient(-330,0,330,0);g.addColorStop(0,'rgba(248,213,138,0)');g.addColorStop(.44,'rgba(248,213,138,.2)');g.addColorStop(.5,'rgba(255,250,226,.95)');g.addColorStop(.56,'rgba(248,213,138,.24)');g.addColorStop(1,'rgba(248,213,138,0)');c.fillStyle=g;c.fillRect(-330,-2,660,4);c.restore();
}
function drawToken(c,text,x,y,t,at,rotation=0) {
  const p=out((t-at)/.48)*(1-smooth((t-at-2.4)/.55));if(p<=0)return;
  c.save();c.globalAlpha=p*.86;c.translate(x,y+(1-out((t-at)/.5))*40);c.rotate(rotation);c.font='700 18px "DM Sans"';const w=c.measureText(text).width+56;
  shadow(c,28,'rgba(0,0,0,.28)',15);box(c,-w/2,-27,w,54,5,'rgba(14,35,55,.86)','rgba(248,213,138,.42)',1);c.shadowColor='transparent';c.fillStyle=LIGHT;c.beginPath();c.arc(-w/2+20,0,4,0,Math.PI*2);c.fill();label(c,text,-w/2+36,6,17,'rgba(248,246,240,.82)',750,'left',2);c.restore();
}
function drawDocument(c,d,t,start,index) {
  const rel=t-start, entrance=out((rel-.08-index*.13)/.48), fly=smooth((rel-1.8-index*.08)/1.0), alpha=entrance*(1-smooth((rel-3.85)/.5));if(alpha<=.004)return;
  const sx=d.x+(index%2?80:-70),sy=d.y+(index%2?-90:80), gx=300+(index%3)*150,gy=585+Math.floor(index/3)*125;
  const x=mix(sx,gx,fly),y=mix(sy,gy,fly),scale=mix(1,.48,fly),rot=mix(d.r,d.r*.16,fly);
  c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(rot);c.scale(scale,scale);
  shadow(c,32,'rgba(0,0,0,.42)',20);box(c,-192,-128,384,256,5,PAPER,'rgba(255,255,255,.65)',1);c.shadowColor='transparent';
  c.fillStyle=index%2?'#142d49':'#d5a34e';c.fillRect(-192,-128,384,30);
  label(c,d.title,-162,-72,19,'#24384a',850,'left',.8);label(c,d.tag,-162,-40,14,'#768697',750,'left',1.3);
  for(let j=0;j<4;j++){c.fillStyle=`rgba(24,46,65,${j===0?.28:.15})`;box(c,-162,-10+j*36,j===0?250:210,6,3,c.fillStyle);}
  c.restore();
}
function drawCore(c,t,start) {
  const p=out((t-start-2.02)/.7);if(!p)return;
  c.save();c.translate(540,832);c.globalAlpha=p;
  const halo=c.createRadialGradient(0,-38,8,0,-38,188);halo.addColorStop(0,'rgba(255,242,204,.9)');halo.addColorStop(.18,'rgba(240,190,99,.54)');halo.addColorStop(1,'rgba(217,166,78,0)');c.fillStyle=halo;c.beginPath();c.arc(0,-38,188,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(0,-38,62,0,Math.PI*2);const orb=c.createRadialGradient(-18,-60,3,0,-38,70);orb.addColorStop(0,'#fff5d9');orb.addColorStop(.3,'#eac273');orb.addColorStop(1,'rgba(170,112,38,.75)');c.fillStyle=orb;c.fill();
  c.strokeStyle='rgba(248,213,138,.64)';c.lineWidth=2;c.beginPath();c.moveTo(0,29);c.lineTo(0,100);c.stroke();
  ['ÉLÈVES   ·   CLASSES','PAIEMENTS   ·   REÇUS','BULLETINS   ·   SUIVI'].forEach((str,i)=>{
    const e=out((t-start-2.2-i*.12)/.4);c.save();c.globalAlpha=e;c.translate((i-1)*6,(96+i*57)+(1-e)*20);c.rotate((i-1)*-.025);shadow(c,22,'rgba(0,0,0,.28)',9);box(c,-224,-21,448,42,5,'rgba(13,34,54,.96)','rgba(248,213,138,.5)',1);c.shadowColor='transparent';label(c,str,0,7,15,'#f5e5c4',800,'center',2.3);c.restore();
  });c.restore();
}
function drawImpact(c,t,cfg) {
  bg(c,t,500,.31);grid(c,t,1200);rings(c,540,480,382,t,.82);particleField(c,t,31,49,1550);topLabel(c,'L’ADMINISTRATION PEUT ÊTRE PLUS SIMPLE',t,.08);
  drawToken(c,'DOSSIERS',170,288,t,.16,-.1);drawToken(c,'01 / 08',875,372,t,.39,.1);drawToken(c,'LISTES',850,625,t,.74,.08);drawToken(c,'PAIEMENTS',190,680,t,.94,-.08);
  wordLines(c,cfg.scenes.problem.headline,t,.46,{size:77,lineH:104,y:870,accent:cfg.scenes.problem.accent,step:.095,gap:19});
  const p=out((t-2.17)/.6);if(p){c.save();c.globalAlpha=p;label(c,'Votre énergie mérite mieux que la paperasse.',540,1212,30,'rgba(233,239,246,.82)',450,'center',.3);c.restore();}
  beam(c,1422,t,3.82,.95);
}
function drawOrder(c,t,cfg) {
  const start=5,rel=t-start;bg(c,t,880,.25);grid(c,t,1260);particleField(c,t,77,34,1660);topLabel(c,'DES INFORMATIONS ÉPARPILLÉES',t,start+.16);
  const docs=[
    {x:245,y:424,r:-.16,title:'LISTE DE CLASSE',tag:'CM2 · A'},
    {x:785,y:497,r:.14,title:'SUIVI SCOLARITÉ',tag:'ÉCHÉANCE'},
    {x:314,y:862,r:.11,title:'NOTES À SAISIR',tag:'TRIMESTRE 1'},
    {x:780,y:1004,r:-.12,title:'REÇU N° 014',tag:'À VÉRIFIER'},
    {x:543,y:681,r:.19,title:'CALCULS…',tag:'45 000 FCFA'}
  ];docs.forEach((d,i)=>drawDocument(c,d,t,start,i));drawCore(c,t,start);
  // Phrase visible après l'organisation, avec une entrée masquée mot par mot.
  wordLines(c,cfg.scenes.transition.headline,t,start+3.05,{size:71,lineH:93,y:1290,accent:cfg.scenes.transition.accent,step:.15,gap:18});
  const p=out((t-start-4.15)/.5);if(p){c.save();c.globalAlpha=p;label(c,'UN SEUL ESPACE. UNE VISION PLUS CLAIRE.',540,1645,19,'rgba(233,239,246,.62)',700,'center',3);c.restore();}
  const q=clamp((rel-4.5)/.86);if(q>0){c.save();c.globalAlpha=Math.sin(q*Math.PI)*.86;c.strokeStyle=LIGHT;c.lineWidth=2;c.shadowColor=GOLD;c.shadowBlur=25;c.beginPath();c.arc(540,923,mix(30,480,q),0,Math.PI*2);c.stroke();c.restore();}
}
function uiIcon(c,name,x,y,color='#49637a') {
  c.save();c.strokeStyle=color;c.lineWidth=2.4;c.lineCap='round';c.lineJoin='round';
  if(name==='people'){c.beginPath();c.arc(x+10,y+7,4,0,Math.PI*2);c.stroke();c.beginPath();c.arc(x+21,y+10,3,0,Math.PI*2);c.stroke();c.beginPath();c.arc(x+14,y+20,7,Math.PI,Math.PI*2);c.stroke();}
  else if(name==='pay'){box(c,x+2,y+4,26,20,4,null,color,2);c.beginPath();c.moveTo(x+2,y+11);c.lineTo(x+28,y+11);c.moveTo(x+7,y+18);c.lineTo(x+14,y+18);c.stroke();}
  else {box(c,x+5,y+2,19,25,2,null,color,2);c.beginPath();c.moveTo(x+10,y+11);c.lineTo(x+20,y+11);c.moveTo(x+10,y+17);c.lineTo(x+20,y+17);c.moveTo(x+10,y+22);c.lineTo(x+17,y+22);c.stroke();}
  c.restore();
}
function drawStat(c,x,y,w,h,icon,title,value,sub,t,delay,color) {
  const p=out((t-delay)/.5);if(!p)return;
  c.save();c.globalAlpha=p;c.translate(0,(1-p)*25);shadow(c,15,'rgba(26,46,64,.08)',7);box(c,x,y,w,h,10,'#fff','#e5eaf0',1);c.shadowColor='transparent';
  const tint=icon==='pay'?'#fbf0dc':icon==='report'?'#e8f1eb':'#e8eff5';box(c,x+17,y+17,38,38,10,tint);uiIcon(c,icon,x+21,y+21,icon==='pay'?'#ac7a2c':icon==='report'?'#528366':'#446e8b');
  label(c,title,x+65,y+42,12,'#8997a4',800,'left',.6);label(c,value,x+17,y+91,31,'#1b3045',850);label(c,sub,x+17,y+115,11,'#8895a1',600);
  if(icon==='pay'){box(c,x+17,y+h-13,w-34,3,2,'#edf0f2');const g=c.createLinearGradient(x+17,0,x+w-17,0);g.addColorStop(0,'#cc9844');g.addColorStop(1,'#f0d28e');box(c,x+17,y+h-13,(w-34)*.86,3,2,g);}
  c.restore();
}
function drawDashboard(c,t,start) {
  const p=out((t-start-.55)/.95);if(!p)return;
  c.save();c.globalAlpha=p;c.translate(0,(1-p)*90);c.transform(1,.012,-.018,1,22,0);
  // contact shadow and a dark, shallow extrusion beneath the floating window
  shadow(c,42,'rgba(0,0,0,.45)',34);box(c,48,415,944,1042,24,'#f2f5f7','rgba(255,255,255,.42)',2);c.shadowColor='transparent';
  box(c,48,415,944,74,24,'#101e2f');c.fillStyle='#101e2f';c.fillRect(48,465,944,24);
  c.beginPath();c.arc(80,451,8,0,Math.PI*2);c.fillStyle=LIGHT;c.fill();label(c,'GESTILYS',100,458,19,'#fff',850,'left',1.8);c.strokeStyle='rgba(255,255,255,.18)';c.beginPath();c.moveTo(220,437);c.lineTo(220,468);c.stroke();label(c,'Tableau de bord',244,458,18,'rgba(255,255,255,.83)',600);
  label(c,'ÉCOLE · EXEMPLE',847,455,12,'#cbd6df',800,'right',1.3);c.beginPath();c.arc(960,451,18,0,Math.PI*2);c.fillStyle='#d9b66d';c.fill();label(c,'A',960,457,15,'#1e3042',850,'center');
  // Nav rail
  c.fillStyle='#e8edf1';c.fillRect(48,489,164,968);box(c,104,520,50,50,14,'#152b43');label(c,'G',129,556,31,LIGHT,600,'center',0,'Georgia');
  const nav=[['Vue d’ensemble','overview'],['Élèves & classes','people'],['Paiements','pay'],['Bulletins','report']];nav.forEach((a,i)=>{const y=609+i*69;if(i===0)box(c,60,y-29,142,50,8,'#152b43');uiIcon(c,a[1],69,y-16,i===0?LIGHT:'#81909d');label(c,a[0],107,y+1,12,i===0?'#fff':'#5b6b7b',700);});
  label(c,'ANNÉE SCOLAIRE',67,1383,10,'#84919d',800,'left',1);label(c,'2025 — 2026',67,1404,12,'#536575',750);
  // Dashboard content
  const x=232;label(c,'Bonjour, Administration',x,540,25,'#172c42',800);label(c,'VOTRE ÉTABLISSEMENT EN UN COUP D’ŒIL',x,565,11,'#85929e',750,'left',.7);
  const sy=590,sw=230,sh=140,gap=12;
  drawStat(c,x,sy,sw,sh,'people','ÉLÈVES','1 248','Classes organisées',t,12.0);
  drawStat(c,x+sw+gap,sy,sw,sh,'pay','PAIEMENTS SUIVIS','86%','Scolarité · trimestre 1',t,12.15);
  drawStat(c,x+(sw+gap)*2,sy,sw,sh,'report','BULLETINS','12','Classes concernées',t,12.3);
  // Students list
  const ty=751,tw=451,th=349;shadow(c,14,'rgba(26,46,64,.06)',6);box(c,x,ty,tw,th,11,'#fff','#e4e9ee',1);c.shadowColor='transparent';label(c,'Élèves & classes',x+18,ty+31,17,'#20364c',800);label(c,'LISTE ILLUSTRÉE',x+tw-17,ty+30,9,'#8d99a4',750,'right',.7);
  const rows=[['AT','Aminata Traoré','CM2 · A'],['MK','Moussa Keïta','Collège · B'],['FD','Fatoumata Diarra','CE1 · A'],['IC','Ibrahim Coulibaly','Collège · A']];
  rows.forEach((r,i)=>{const yy=ty+79+i*64;c.strokeStyle='#edf0f3';c.beginPath();c.moveTo(x+15,yy+43);c.lineTo(x+tw-15,yy+43);c.stroke();c.beginPath();c.arc(x+33,yy+19,15,0,Math.PI*2);c.fillStyle=['#dce8ef','#f4e6c8','#e0ece4','#e2e7f1'][i];c.fill();label(c,r[0],x+33,yy+24,9,'#334f68',850,'center');label(c,r[1],x+61,yy+24,13,'#34495d',740);label(c,r[2],x+tw-15,yy+23,10,'#82909b',650,'right');});
  // Payments graph
  const fx=x+464,fw=235;shadow(c,14,'rgba(26,46,64,.06)',6);box(c,fx,ty,fw,349,11,'#fff','#e4e9ee',1);c.shadowColor='transparent';label(c,'Suivi des paiements',fx+15,ty+31,15,'#20364c',800);label(c,'TRIMESTRE 1 · EXEMPLE',fx+15,ty+53,9,'#8a97a2',750,'left',.6);
  for(let j=0;j<4;j++){c.strokeStyle='#eff2f4';c.beginPath();c.moveTo(fx+15,ty+111+j*49);c.lineTo(fx+fw-13,ty+111+j*49);c.stroke();}
  const vals=[.39,.62,.52,.77,.61,.91,.73,.98,.75,.9,.69,.95];vals.forEach((v,i)=>{const bx=fx+19+i*16,by=ty+286-v*140,grad=c.createLinearGradient(0,by,0,ty+286);grad.addColorStop(0,i%3===0?'#e2c47e':i%3===1?'#88a9b9':'#aac2ae');grad.addColorStop(1,i%3===0?'#b38a43':i%3===1?'#426d89':'#668674');box(c,bx,by,10,ty+286-by,3,grad);});
  label(c,'Progression des encaissements',fx+15,ty+319,9,'#84919d',650);label(c,'1re tranche',fx+fw-15,ty+319,9,'#667989',750,'right');
  // Floating receipt and report, raised from the main glass plane.
  c.save();c.translate(815,886);c.rotate(.035);shadow(c,30,'rgba(2,11,20,.32)',17);box(c,-126,-131,256,205,11,'rgba(255,255,255,.98)','#fff',1);c.shadowColor='transparent';label(c,'REÇU DE PAIEMENT',-106,-103,10,'#927849',850,'left',1);label(c,'N° 0001 · EXEMPLE',-106,-83,9,'#92a0ab',700);label(c,'Aminata Traoré',-106,-49,14,'#2a3d51',800);label(c,'Scolarité · 1re tranche',-106,-29,10,'#758493',600);c.strokeStyle='#e3e8ed';c.setLineDash([3,4]);c.beginPath();c.moveTo(-106,-12);c.lineTo(105,-12);c.stroke();c.setLineDash([]);label(c,'45 000 FCFA',-106,18,19,'#20364a',850);c.save();c.translate(54,45);c.rotate(-.11);box(c,-32,-13,67,27,3,null,'#c89d50',1.5);label(c,'PAYÉ',1,5,10,'#a77e37',900,'center',.6);c.restore();c.restore();
  c.save();c.translate(817,1150);c.rotate(-.028);shadow(c,30,'rgba(2,11,20,.3)',17);box(c,-126,-100,256,184,11,'rgba(255,255,255,.99)','#fff',1);c.shadowColor='transparent';label(c,'BULLETIN · 1ER TRIMESTRE',-106,-73,9,'#8f7950',850,'left',.4);label(c,'Aminata T.',-106,-43,15,'#2a3d51',800);label(c,'Mathématiques',-106,-17,10,'#6e7e8c',700);box(c,-106,-8,210,6,3,'#edf0f3');box(c,-106,-8,164,6,3,'#cba256');label(c,'Français',-106,22,10,'#6e7e8c',700);box(c,-106,30,210,6,3,'#edf0f3');box(c,-106,30,140,6,3,'#7798ab');label(c,'14,0',-106,66,21,'#23384c',850);label(c,'/20',-53,66,12,'#8997a2',650);c.restore();
  c.restore();
}
function drawProduct(c,t,cfg) {
  bg(c,t,980,.38);particleField(c,t,109,34,1740);rings(c,540,1000,650,t,.48);topLabel(c,'GESTILYS · LA VUE D’ENSEMBLE',t,11.1);
  const kick=out((t-11.22)/.5);if(kick){c.save();c.globalAlpha=kick;label(c,'ÉLÈVES  ·  PAIEMENTS  ·  BULLETINS',82,264,20,LIGHT,800,'left',3);label(c,'TOUT AU MÊME',82,337,61,WHITE,850,'left',-1.5);label(c,'ENDROIT.',82,400,61,WHITE,850,'left',-1.5);c.restore();}
  drawDashboard(c,t,11);const p=out((t-18.15)/.4);if(p){c.save();c.globalAlpha=p;label(c,cfg.brand.disclaimer,540,1654,19,'rgba(233,239,246,.68)',650,'center',1.5);c.restore();}
  beam(c,1710,t,18.2,.75);
}
function drawLogo(c,x,y,size,progress=1) {
  c.save();const grad=c.createLinearGradient(x-size/2,y-size/2,x+size/2,y+size/2);grad.addColorStop(0,'#f6d68f');grad.addColorStop(.55,'#d9a64e');grad.addColorStop(1,'#a9762d');
  shadow(c,54,'rgba(217,166,78,.32)',22);box(c,x-size/2,y-size/2,size,size,size*.25,grad,'rgba(255,243,216,.62)',1);c.shadowColor='transparent';
  c.beginPath();c.arc(x,y,size*.29,-Math.PI*.82,Math.PI*1.82);c.strokeStyle=`rgba(255,253,246,${progress})`;c.lineWidth=size*.082;c.lineCap='round';c.stroke();
  c.beginPath();c.moveTo(x+size*.29,y);c.lineTo(x+size*.03,y);c.stroke();c.restore();
}
function drawIdentity(c,t,cfg) {
  const start=19;bg(c,t,870,.44);particleField(c,t,239,76,1740);rings(c,540,846,505,t,.92);
  c.save();c.translate(540,846);for(let i=0;i<28;i++){const a=i*Math.PI/14+t*.025;c.save();c.rotate(a);const grad=c.createLinearGradient(0,-350,0,-470);grad.addColorStop(0,'rgba(248,213,138,.42)');grad.addColorStop(1,'rgba(248,213,138,0)');c.strokeStyle=grad;c.lineWidth=1.3;c.beginPath();c.moveTo(0,-340);c.lineTo(0,-470);c.stroke();c.restore();}c.restore();
  const reveal=out((t-start-.32)/.84);if(reveal){c.save();c.globalAlpha=reveal;const size=218;drawLogo(c,540,715,size,reveal);c.restore();}
  const nameP=out((t-start-1.05)/.72);if(nameP){c.save();c.globalAlpha=nameP;c.translate(540,1010+(1-nameP)*48);label(c,cfg.brand.name,0,0,133,'#fffdf7',800,'center',-5);c.restore();}
  const ruleP=out((t-start-1.68)/.6);if(ruleP){c.save();c.globalAlpha=ruleP;const w=240*ruleP,g=c.createLinearGradient(540-w/2,0,540+w/2,0);g.addColorStop(0,'rgba(248,213,138,0)');g.addColorStop(.5,'#fff0c7');g.addColorStop(1,'rgba(248,213,138,0)');c.fillStyle=g;c.fillRect(540-w/2,1082, w,2);c.restore();}
  const tag=out((t-start-2.05)/.6);if(tag){c.save();c.globalAlpha=tag;label(c,cfg.brand.tagline.toUpperCase(),540,1186,35,'rgba(245,244,238,.91)',600,'center',1,'Georgia');c.restore();}
  const cap=out((t-start-3.55)/.5);if(cap){c.save();c.globalAlpha=cap;label(c,'L’OUTIL QUI LIBÈRE VOTRE ATTENTION',540,1455,18,'rgba(233,239,246,.62)',750,'center',4);c.restore();}
}
function drawClose(c,t,cfg) {
  const start=25;bg(c,t,880,.33);particleField(c,t,319,32,1500);rings(c,540,800,366,t,.48);
  const p=out((t-start-.05)/.55);if(p){c.save();c.globalAlpha=p;drawLogo(c,540,582,142,p);c.restore();}
  const np=out((t-start-.27)/.48);if(np){c.save();c.globalAlpha=np;label(c,cfg.brand.name,540,738,79,WHITE,800,'center',-3);c.restore();}
  const cp=out((t-start-.49)/.5);if(cp){c.save();c.globalAlpha=cp;label(c,'VOTRE ÉCOLE,',540,930,51,WHITE,650,'center',1.6);label(c,'MIEUX ORGANISÉE.',540,1000,59,LIGHT,850,'center');c.restore();}
  const bp=out((t-start-1.02)/.52);if(bp){c.save();c.globalAlpha=bp;const scale=.94+.06*bp;c.translate(540,1330);c.scale(scale,scale);shadow(c,43,'rgba(200,145,55,.31)',20);const g=c.createLinearGradient(-420,-72,420,72);g.addColorStop(0,'#f7d993');g.addColorStop(.52,'#d9a64e');g.addColorStop(1,'#bf8837');box(c,-420,-75,840,150,12,g,'rgba(255,245,218,.82)',1.2);c.shadowColor='transparent';label(c,'DEMANDEZ UNE',0,-7,21,'#182b3e',800,'center',4);label(c,'DÉMONSTRATION',0,38,34,'#122337',900,'center');c.restore();}
  const dp=out((t-start-1.5)/.5);if(dp){c.save();c.globalAlpha=dp;label(c,cfg.brand.descriptor.toUpperCase(),540,1537,17,'rgba(230,237,241,.55)',700,'center',2.2);c.restore();}
  // Dernière respiration : halo qui se referme en douceur, pas de cut noir au dernier frame.
  const tail=clamp((t-27.35)/.65);if(tail){c.save();c.globalAlpha=tail*.13;c.fillStyle='#fff';c.fillRect(0,0,W,H);c.restore();}
}
function alphaFor(t,start,end,first,last) {
  const fi=first?1:smooth((t-start+.36)/.36),fo=last?1:1-smooth((t-end+.36)/.36);return fi*fo;
}
export function renderFrame(ctx,t,cfg) {
  GOLD=cfg.colors?.gold||GOLD;LIGHT=cfg.colors?.goldLight||LIGHT;WHITE=cfg.colors?.white||WHITE;
  ctx.save();ctx.clearRect(0,0,W,H);
  const scenes=[{s:0,e:5,first:true,draw:()=>drawImpact(ctx,t,cfg)},{s:5,e:11,draw:()=>drawOrder(ctx,t,cfg)},{s:11,e:19,draw:()=>drawProduct(ctx,t,cfg)},{s:19,e:25,draw:()=>drawIdentity(ctx,t,cfg)},{s:25,e:28,last:true,draw:()=>drawClose(ctx,t,cfg)}];
  let active=false;
  for(const sc of scenes){if(t<sc.s-.37||t>sc.e+.37)continue;const a=alphaFor(t,sc.s,sc.e,!!sc.first,!!sc.last);if(a<=0)continue;ctx.save();ctx.globalAlpha=a;sc.draw();ctx.restore();active=true;}
  if(!active){bg(ctx,t);}
  // restrained cinematic falloff
  const vg=ctx.createRadialGradient(W/2,H*.47,450,W/2,H*.47,1220);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(.7,'rgba(0,0,0,.04)');vg.addColorStop(1,'rgba(0,0,0,.36)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  ctx.restore();
}
export const VIDEO={width:W,height:H,fps:30,duration:28};
