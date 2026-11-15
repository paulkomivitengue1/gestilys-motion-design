import {createCanvas,GlobalFonts} from '@napi-rs/canvas';
import {mkdirSync,rmSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';
import {renderKineticFrame,DURATION} from '../src/kinetic-demo.js';
const root=resolve(new URL('..',import.meta.url).pathname),out=join(root,'kinetic-frames');
if(existsSync(out))rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
const require=createRequire(import.meta.url);GlobalFonts.registerFromPath(require.resolve('@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2'),'DM Sans');
const canvas=createCanvas(1080,1920),ctx=canvas.getContext('2d'),fps=30,total=Math.round(DURATION*fps);
for(let i=0;i<total;i++){renderKineticFrame(ctx,i/fps);writeFileSync(join(out,`${String(i+1).padStart(5,'0')}.png`),canvas.toBuffer('image/png'));if((i+1)%60===0)console.log(`Images : ${i+1}/${total}`);}
console.log(`Rendu terminé : ${total} images dans ${out}`);
