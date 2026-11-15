// Rendu déterministe image par image avec Skia Canvas (aucun navigateur ni service externe).
// PREVIEW=1 écrit une sélection d'images clés ; sinon 28 s × 30 i/s = 840 PNG.
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { renderFrame } from '../src/scenes.js';
import { readFileSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'config', 'video.config.json'), 'utf8'));
const { fps, width, height } = cfg.video;
const preview = process.env.PREVIEW === '1';
const S = cfg.scenes;
const definitions = [
  { key: 'problem', name: '1-impact', t0: 0 },
  { key: 'transition', name: '2-ordre', t0: 5 },
  { key: 'solution', name: '3-solution', t0: 11 },
  { key: 'signature', name: '4-identite', t0: 19 },
  { key: 'close', name: '5-conclusion', t0: 25 }
];
const total = definitions.reduce((n, s) => n + S[s.key].duration, 0);
const totalFrames = Math.round(total * fps);
const outDir = join(root, preview ? 'out/preview' : 'frames');
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const require = createRequire(import.meta.url);
const font = require.resolve('@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2');
GlobalFonts.registerFromPath(font, 'DM Sans');
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');
let jobs = [];
if (preview) {
  const fractions = [[.14,.42,.72,.93],[.12,.42,.7,.92],[.1,.28,.48,.7,.9],[.15,.5,.84,.97],[.18,.48,.78,.98]];
  definitions.forEach((scene,i)=>fractions[i].forEach((f,j)=>{
    const t=Math.min(total-1/fps,scene.t0+S[scene.key].duration*f);
    jobs.push({name:`${scene.name}-${String(j+1).padStart(2,'0')}-t${t.toFixed(2)}s.png`,t});
  }));
} else {
  for(let i=0;i<totalFrames;i++)jobs.push({name:`${String(i+1).padStart(5,'0')}.png`,t:i/fps});
}
console.log(`Rendu ${preview?'APERÇU':'VIDÉO'} : ${jobs.length} image(s), ${width}×${height}, ${fps} i/s, durée ${total} s.`);
const started=Date.now();
for(let i=0;i<jobs.length;i++){
  const job=jobs[i];renderFrame(ctx,job.t,cfg);
  writeFileSync(join(outDir,job.name),canvas.toBuffer('image/png'));
  if((i+1)%60===0||i+1===jobs.length){
    const elapsed=(Date.now()-started)/1000;
    console.log(`  ${i+1}/${jobs.length} images — ${( (i+1)/elapsed).toFixed(1)} i/s — ${elapsed.toFixed(1)} s`);
  }
}
console.log(`Terminé : ${jobs.length} image(s) dans ${outDir}`);
