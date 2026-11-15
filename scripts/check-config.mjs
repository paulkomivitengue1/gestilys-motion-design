// Validation strict de la configuration de campagne avant le rendu.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const file = resolve(root, 'config', 'video.config.json');
const errors = [];
let cfg;
try { cfg = JSON.parse(readFileSync(file, 'utf8')); }
catch (e) { console.error(`::error file=config/video.config.json::JSON invalide : ${e.message}`); process.exit(1); }
const need = (ok, msg) => { if (!ok) errors.push(msg); };
const positive = (x) => typeof x === 'number' && Number.isFinite(x) && x > 0;
const hex = (x) => typeof x === 'string' && /^#[0-9a-f]{6}$/i.test(x);
need(cfg.video?.fps === 30, 'La campagne est conçue pour 30 i/s.');
need(cfg.video?.width === 1080 && cfg.video?.height === 1920, 'La composition doit être 1080 × 1920 (9:16).');
for (const k of ['navy','navyDeep','navyMid','white','mist','gold','goldLight','ink','muted']) need(hex(cfg.colors?.[k]), `colors.${k} doit être une couleur #RRGGBB.`);
for (const k of ['name','descriptor','tagline','cta','disclaimer']) need(typeof cfg.brand?.[k] === 'string' && cfg.brand[k].trim(), `brand.${k} est obligatoire.`);
const S = cfg.scenes || {};
for (const k of ['problem','transition','solution','signature','close']) need(positive(S[k]?.duration), `scenes.${k}.duration doit être supérieur à zéro.`);
need(S.problem?.duration === 5 && S.transition?.duration === 6 && S.solution?.duration === 8 && S.signature?.duration === 6 && S.close?.duration === 3,
  'La nouvelle campagne est minutée en 5 + 6 + 8 + 6 + 3 secondes (28 s).');
need(Array.isArray(S.problem?.headline) && S.problem.headline.length === 3, 'La phrase d’impact doit tenir sur trois lignes.');
need(Array.isArray(S.transition?.headline) && S.transition.headline.length === 2, 'Le message de transition doit tenir sur deux lignes.');
const known = ['students','payments','report','receipts','enrollment'];
const features = S.solution?.features || [];
features.forEach(f => need(known.includes(f.id), `Fonctionnalité inconnue : « ${f.id} ».`));
need(features.filter(f => f.enabled).length >= 3, 'Élèves, paiements et bulletins doivent apparaître dans le tableau de bord.');
if (errors.length) { errors.forEach(e => console.error(`::error file=config/video.config.json::${e}`)); process.exit(1); }
const total = S.problem.duration + S.transition.duration + S.solution.duration + S.signature.duration + S.close.duration;
console.log(`Configuration valide — nouvelle campagne en 5 scènes, ${total} s, 1080×1920, 30 i/s.`);
