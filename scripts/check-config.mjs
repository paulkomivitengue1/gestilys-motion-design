// Vérifie config/video.config.json avant le rendu (erreurs claires dans les journaux).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const file = resolve(root, 'config', 'video.config.json');
const problems = [];
const warnings = [];
let cfg;
try {
  cfg = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`::error file=config/video.config.json::JSON invalide : ${e.message}`);
  process.exit(1);
}

const need = (cond, msg) => { if (!cond) problems.push(msg); };
const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);

need(cfg.video && Number.isInteger(cfg.video.fps) && cfg.video.fps >= 24 && cfg.video.fps <= 60, 'video.fps doit être un entier entre 24 et 60');
need(cfg.video && cfg.video.width === 1080 && cfg.video.height === 1920, 'video.width/height doivent rester 1080 × 1920 (la mise en page est dessinée pour ce format)');

for (const k of ['navy', 'navyDeep', 'navyMid', 'white', 'mist', 'gold', 'goldLight', 'ink', 'muted']) {
  need(cfg.colors && isHex(cfg.colors[k]), `colors.${k} doit être une couleur hexadécimale du type #RRGGBB`);
}
for (const k of ['name', 'descriptor', 'tagline', 'cta', 'disclaimer']) {
  need(cfg.brand && typeof cfg.brand[k] === 'string' && cfg.brand[k].trim() !== '', `brand.${k} est obligatoire`);
}

const S = cfg.scenes || {};
for (const k of ['problem', 'transition', 'solution', 'signature']) {
  need(S[k] && isNum(S[k].duration), `scenes.${k}.duration doit être un nombre de secondes > 0`);
}
need(S.problem && Array.isArray(S.problem.headline) && S.problem.headline.length >= 1 && S.problem.headline.length <= 3, 'scenes.problem.headline : 1 à 3 lignes');
need(S.transition && Array.isArray(S.transition.headline) && S.transition.headline.length >= 1 && S.transition.headline.length <= 3, 'scenes.transition.headline : 1 à 3 lignes');

const feats = (S.solution && S.solution.features) || [];
const known = ['students', 'enrollment', 'payments', 'receipts', 'report'];
feats.forEach((f) => need(known.includes(f.id), `Fonctionnalité inconnue : « ${f.id} » (valeurs possibles : ${known.join(', ')})`));
const enabled = feats.filter((f) => f.enabled && known.includes(f.id));
need(enabled.length >= 1, 'Au moins une fonctionnalité doit avoir "enabled": true');
if (S.solution && isNum(S.solution.duration) && enabled.length) {
  const slot = S.solution.duration / enabled.length;
  if (slot < 2.5) warnings.push(`Chaque écran dure ${slot.toFixed(1)} s : trop court pour être lisible. Allongez scenes.solution.duration (conseil : ≥ 3 s par écran).`);
}

if (problems.length) {
  problems.forEach((p) => console.error(`::error file=config/video.config.json::${p}`));
  process.exit(1);
}
warnings.forEach((w) => console.log(`::warning file=config/video.config.json::${w}`));

const total = S.problem.duration + S.transition.duration + S.solution.duration + S.signature.duration;
if (total < 20 || total > 60) console.log(`::warning::Durée totale ${total} s (cible conseillée : 30 à 40 s).`);
console.log(`Configuration valide — durée totale ${total} s, ${enabled.length} écran(s) de fonctionnalités : ${enabled.map((f) => f.id).join(', ')}`);
