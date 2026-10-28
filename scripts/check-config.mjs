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
const isTextList = (a, min, max) => Array.isArray(a) && a.length >= min && a.length <= max && a.every((l) => typeof l === 'string' && l.trim() !== '');

need(cfg.video && Number.isInteger(cfg.video.fps) && cfg.video.fps >= 24 && cfg.video.fps <= 60, 'video.fps doit être un entier entre 24 et 60');
need(cfg.video && cfg.video.width === 1080 && cfg.video.height === 1920, 'video.width/height doivent rester 1080 × 1920 (la mise en page est dessinée pour ce format)');

for (const k of ['navy', 'navyDeep', 'navyMid', 'white', 'mist', 'gold', 'goldLight', 'ink', 'muted']) {
  need(cfg.colors && isHex(cfg.colors[k]), `colors.${k} doit être une couleur hexadécimale du type #RRGGBB`);
}
for (const k of ['name', 'descriptor', 'tagline', 'cta', 'disclaimer']) {
  need(cfg.brand && typeof cfg.brand[k] === 'string' && cfg.brand[k].trim() !== '', `brand.${k} est obligatoire`);
}

// Carte d'appel à l'action de l'écran final (facultative : sans elle, l'ancien bouton « brand.cta » est utilisé)
const card = cfg.brand && cfg.brand.ctaCard;
if (card !== undefined) {
  need(card !== null && typeof card === 'object', 'brand.ctaCard doit être un objet');
  if (card && typeof card === 'object') {
    need(isTextList(card.lines, 1, 4), 'brand.ctaCard.lines : 1 à 4 lignes de texte non vides');
    need(isTextList(card.contact, 1, 3), 'brand.ctaCard.contact : 1 à 3 lignes de texte non vides');
    need(card.badge === undefined || (typeof card.badge === 'string'), 'brand.ctaCard.badge doit être un texte');
    need(card.highlight === undefined || (Number.isInteger(card.highlight) && Array.isArray(card.lines) && card.highlight >= 0 && card.highlight < card.lines.length), 'brand.ctaCard.highlight doit être le numéro (à partir de 0) d\'une ligne de « lines »');
  }
}

const S = cfg.scenes || {};
for (const k of ['problem', 'transition', 'solution', 'signature']) {
  need(S[k] && isNum(S[k].duration), `scenes.${k}.duration doit être un nombre de secondes > 0`);
}
need(S.signature === undefined || S.signature.ctaAt === undefined || isNum(S.signature.ctaAt), 'scenes.signature.ctaAt doit être un nombre de secondes > 0');
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

// Le message final doit rester affiché assez longtemps pour être lu
if (card && S.signature && isNum(S.signature.duration)) {
  const at = typeof S.signature.ctaAt === 'number' ? S.signature.ctaAt : 5.4;
  const hold = S.signature.duration - at;
  const delay = typeof card.contactDelay === 'number' ? card.contactDelay : 4.0;
  if (hold < 7) warnings.push(`La carte finale reste affichée ${hold.toFixed(1)} s seulement (conseil : ≥ 7 s). Allongez scenes.signature.duration.`);
  if (delay >= hold) warnings.push('brand.ctaCard.contactDelay est plus grand que la durée d\'affichage de la carte : la ligne de contact n\'apparaîtrait pas.');
}

if (problems.length) {
  problems.forEach((p) => console.error(`::error file=config/video.config.json::${p}`));
  process.exit(1);
}
warnings.forEach((w) => console.log(`::warning file=config/video.config.json::${w}`));

const total = S.problem.duration + S.transition.duration + S.solution.duration + S.signature.duration;
if (total < 20 || total > 60) console.log(`::warning::Durée totale ${total} s (cible conseillée : 30 à 45 s).`);
const cues = (cfg.audio && cfg.audio.voiceoverCues) || [];
if (cues.some((c) => typeof c !== 'number' || c < 0 || c >= total)) console.log('::warning::audio.voiceoverCues : au moins un instant est en dehors de la vidéo.');
console.log(`Configuration valide — durée totale ${total} s, ${enabled.length} écran(s) de fonctionnalités : ${enabled.map((f) => f.id).join(', ')}${card ? ', carte finale d\'essai gratuit' : ''}`);
