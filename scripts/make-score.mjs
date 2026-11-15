// Partition originale générative Gestilys : D majeur, arpèges feutrés et impulsions douces.
// Synthèse PCM locale, sans sample, bibliothèque musicale, API ni droits tiers.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('.',import.meta.url)),'..');
const sampleRate=48000,duration=28,frames=sampleRate*duration;
const left=new Float32Array(frames),right=new Float32Array(frames);
const bpm=96,beat=60/bpm,bar=beat*4;
const hz=m=>440*Math.pow(2,(m-69)/12);
const noise=(n)=>{const x=Math.sin(n*127.1+311.7)*43758.5453123;return (x-Math.floor(x))*2-1;};
const chords=[[50,57,62,66],[45,52,57,61],[47,54,59,62],[43,50,55,59]];
const motif=[62,66,69,74,73,69,66,64];
function addVoice(time,frequency,amp,decay,pan,partials=[1,.26,.09]){
 const begin=Math.floor(time*sampleRate),len=Math.min(frames-begin,Math.floor(decay*sampleRate));
 for(let j=0;j<len;j++){
   const t=j/sampleRate,envelope=Math.exp(-t*(3.3/decay));
   const atk=Math.min(1,j/(sampleRate*.014));let val=0;
   for(let p=0;p<partials.length;p++) val+=partials[p]*Math.sin(2*Math.PI*frequency*(p+1)*t);
   const s=val*envelope*atk*amp,idx=begin+j;left[idx]+=s*Math.sqrt((1-pan)*.5);right[idx]+=s*Math.sqrt((1+pan)*.5);
 }
}
// Airy harmonic bed, slow chord changes and tiny detuning create a gentle cinematic width.
for(let i=0;i<Math.ceil(duration/bar);i++){
 const chord=chords[i%chords.length],at=i*bar;
 chord.slice(0,3).forEach((note,j)=>{
   const f=hz(note+(j===1?12:0));addVoice(at,f,.022,j===0?bar*1.7:bar*1.35,(j-1)*.48,[1,.32,.1]);
 });
}
// Bell-like arpeggio: a short melody with space, no familiar copyrighted theme.
for(let i=0;i<Math.ceil(duration/beat);i++){
 const at=i*beat+.04,note=motif[i%motif.length];
 addVoice(at,hz(note),.093,.72,Math.sin(i*.8)*.34,[1,.46,.19,.07]);
 if(i%2===1) addVoice(at+.02,hz(note-12),.027,.52,-.26,[1,.18]);
}
// Round, restrained low pulse and soft offbeat ticks.
for(let i=0;i<Math.ceil(duration/beat);i++){
 const at=i*beat;
 if(i%4===0){const begin=Math.floor(at*sampleRate),len=Math.floor(.22*sampleRate);for(let j=0;j<len&&begin+j<frames;j++){const x=j/sampleRate,env=Math.exp(-x*22),f=47+45*Math.exp(-x*28),v=Math.sin(2*Math.PI*f*x)*env*.105;left[begin+j]+=v;right[begin+j]+=v;}}
 if(i%2===1){const begin=Math.floor((at+beat*.5)*sampleRate),len=Math.floor(.045*sampleRate);for(let j=0;j<len&&begin+j<frames;j++){const x=j/sampleRate,n=noise(i*4099+j)*Math.exp(-x*95)*.014;left[begin+j]+=n*.64;right[begin+j]-=n*.55;}}
}
const header=Buffer.alloc(44),data=Buffer.alloc(frames*4);
header.write('RIFF',0);header.writeUInt32LE(36+data.length,4);header.write('WAVE',8);header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(2,22);header.writeUInt32LE(sampleRate,24);header.writeUInt32LE(sampleRate*4,28);header.writeUInt16LE(4,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(data.length,40);
for(let i=0;i<frames;i++){
 const fadeIn=Math.min(1,i/(sampleRate*.9)),fadeOut=Math.min(1,(frames-i)/(sampleRate*2.4));
 const l=Math.tanh(left[i]*1.45)*fadeIn*fadeOut*.82,r=Math.tanh(right[i]*1.45)*fadeIn*fadeOut*.82;
 data.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(l*32767))),i*4);
 data.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(r*32767))),i*4+2);
}
const out=resolve(root,'build/music-generated.wav');mkdirSync(dirname(out),{recursive:true});writeFileSync(out,Buffer.concat([header,data]));
console.log(`Partition Gestilys originale : ${duration} s, ${sampleRate} Hz, stéréo → ${out}`);
