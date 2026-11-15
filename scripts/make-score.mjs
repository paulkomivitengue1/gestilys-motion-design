// Sound design original Gestilys : electro-cinematic upbeat, synthèse PCM locale.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('.',import.meta.url)),'..');
const sr=48000,duration=28,frames=sr*duration;
const L=new Float32Array(frames),R=new Float32Array(frames);
const bpm=112,beat=60/bpm,bar=beat*4;
const hz=n=>440*Math.pow(2,(n-69)/12);
const clamp=(v,a=-1,b=1)=>Math.max(a,Math.min(b,v));
const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453123;return (x-Math.floor(x))*2-1;};
function tone(at,freq,amp,decay,partials=[1,.25,.08],pan=0){const start=Math.floor(at*sr),len=Math.min(frames-start,Math.floor(decay*sr));for(let j=0;j<len;j++){const t=j/sr,e=Math.pow(1-j/len,2.2),v=partials.reduce((s,p,k)=>s+p*Math.sin(2*Math.PI*freq*(k+1)*t),0)*amp*e;const i=start+j;L[i]+=v*Math.sqrt((1-pan)*.5);R[i]+=v*Math.sqrt((1+pan)*.5);}}
function kick(at,amp=1){const start=Math.floor(at*sr),len=Math.floor(.34*sr);for(let j=0;j<len&&start+j<frames;j++){const t=j/sr,phase=2*Math.PI*(48*t+34*(1-Math.exp(-t*23))/23),v=Math.sin(phase)*Math.exp(-t*13)*amp*.56;L[start+j]+=v;R[start+j]+=v;}}
function snare(at,amp=.7){const start=Math.floor(at*sr),len=Math.floor(.19*sr);for(let j=0;j<len&&start+j<frames;j++){const t=j/sr,n=noise(j+Math.floor(at*sr)*7),v=(n*.75*Math.exp(-t*24)+Math.sin(2*Math.PI*185*t)*Math.exp(-t*19)*.25)*amp*.24;L[start+j]+=v;R[start+j]+=v;}}
function hat(at,amp=.16){const start=Math.floor(at*sr),len=Math.floor(.045*sr);for(let j=0;j<len&&start+j<frames;j++){const t=j/sr,v=noise(j+Math.floor(at*sr)*13)*Math.exp(-t*105)*amp;L[start+j]+=v*.72;R[start+j]+=v*.78;}}
function bass(at,note,amp=.22){const start=Math.floor(at*sr),len=Math.floor(.42*sr),f=hz(note);for(let j=0;j<len&&start+j<frames;j++){const t=j/sr,e=Math.pow(1-j/len,1.6),v=(Math.sin(2*Math.PI*f*t)+.24*Math.sin(4*Math.PI*f*t))*amp*e;L[start+j]+=v*.72;R[start+j]+=v*.72;}}
function riser(at,dur=1.15){const start=Math.floor(at*sr),len=Math.floor(dur*sr);for(let j=0;j<len&&start+j<frames;j++){const p=j/len,t=j/sr,n=noise(j+start*3),env=p*p*.12,v=(n*.7+Math.sin(2*Math.PI*(180+1500*p)*t)*.3)*env;L[start+j]+=v;R[start+j]+=v;}}
function impact(at){kick(at,1.45);tone(at,55,.34,.72,[1,.35,.12]);}
const roots=[45,41,43,38],chords=[[57,60,64,69],[53,57,60,65],[55,59,62,67],[50,54,57,62]];
// Beat principal et percussions syncopées.
for(let i=0;i<Math.ceil(duration/beat);i++){
 const at=i*beat,barBeat=i%4;
 kick(at,barBeat===0?1.15:.9);
 if(barBeat===1||barBeat===3)snare(at,.82);
 hat(at,.12);hat(at+beat*.5,.085);
 bass(at,roots[Math.floor(i/4)%4]+(barBeat===2?12:0),.24);
 if(i%2===1)tone(at+.02,hz([76,79,81,84][i%4]),.038,.16,[1,.18],.24);
}
// Stabs harmoniques et motif lumineux.
for(let b=0;b<Math.ceil(duration/bar);b++){
 const at=b*bar,ch=chords[b%4];
 ch.forEach((n,j)=>tone(at+.015,hz(n),.055,.72,[1,.28,.08],(j-1.5)*.18));
 [0,1,2,3,2,1,3,2].forEach((step,k)=>tone(at+k*beat*.5+.035,hz(ch[step]),.046,.24,[1,.2],(k%2?-.3:.3)));
}
// Impacts et montées calés sur les changements de scène.
[0,5,11,19,25].forEach((t,i)=>{impact(t);if(t>0)riser(t-.85,.85);});
for(let i=0;i<frames;i++){
 const t=i/sr,fadeIn=Math.min(1,t/.16),fadeOut=Math.min(1,(duration-t)/1.15);
 const master=.82*fadeIn*fadeOut;
 L[i]=Math.tanh(L[i]*1.22)*master;R[i]=Math.tanh(R[i]*1.22)*master;
}
const header=Buffer.alloc(44),data=Buffer.alloc(frames*4);
header.write('RIFF',0);header.writeUInt32LE(36+data.length,4);header.write('WAVE',8);header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(2,22);header.writeUInt32LE(sr,24);header.writeUInt32LE(sr*4,28);header.writeUInt16LE(4,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(data.length,40);
for(let i=0;i<frames;i++){data.writeInt16LE(Math.round(clamp(L[i])*32767),i*4);data.writeInt16LE(Math.round(clamp(R[i])*32767),i*4+2);}
const out=resolve(root,'build/music-generated.wav');mkdirSync(dirname(out),{recursive:true});writeFileSync(out,Buffer.concat([header,data]));
console.log(`Bande-son originale Gestilys : electro-cinematic, ${bpm} BPM, ${duration}s, stéréo → ${out}`);
