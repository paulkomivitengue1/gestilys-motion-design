import {createCanvas,GlobalFonts} from '@napi-rs/canvas';
import {mkdirSync,rmSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';
import {renderCinematicFrame,VIDEO} from '../src/cinematic-55.js';
const root=resolve(new URL('..',import.meta.url).pathname),out=join(root,'out'),frames=join(out,'frames');
if(existsSync(frames))rmSync(frames,{recursive:true,force:true});
mkdirSync(frames,{recursive:true});
const cfg=JSON.parse(readFileSync(join(root,'config/video.config.json'),'utf8'));
const require=createRequire(import.meta.url);
GlobalFonts.registerFromPath(require.resolve('@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2'),'DM Sans');
const canvas=createCanvas(VIDEO.width,VIDEO.height),ctx=canvas.getContext('2d');
const total=Math.round(VIDEO.duration*VIDEO.fps);
for(let i=0;i<total;i++){renderCinematicFrame(ctx,i/VIDEO.fps,cfg);writeFileSync(join(frames,String(i+1).padStart(5,'0')+'.png'),canvas.toBuffer('image/png'));if((i+1)%150===0)console.log('Images rendues : '+(i+1)+'/'+total);}
console.log('Rendu terminé : '+total+' images, '+VIDEO.duration+' secondes.');
