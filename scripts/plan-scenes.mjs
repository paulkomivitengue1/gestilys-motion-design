// Agent visuel : transforme une proposition validée structurellement en plan compatible avec le moteur existant.
// Ne lance aucun rendu et ne modifie pas la configuration source.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const base = JSON.parse(await readFile(new URL('../config/video.config.json', import.meta.url), 'utf8'));
const proposal = JSON.parse(await readFile(new URL('../out/ai-studio/proposal.json', import.meta.url), 'utf8'));
const fail = message => { throw new Error(`Plan visuel refusé : ${message}`); };
if (proposal.status !== 'DRAFT_REQUIRES_HUMAN_APPROVAL') fail('validation humaine du scénario requise');
const ids = proposal.selected_feature_ids;
if (!Array.isArray(ids) || ids.length < 1 || ids.length > 2) fail('une ou deux fonctionnalités sont requises pour garder un rythme lisible');
if (new Set(ids).size !== ids.length) fail('fonctionnalité répétée');
const known = new Map(base.scenes.solution.features.map(f => [f.id, f]));
const proposed = new Map((proposal.config_changes?.scenes?.solution?.features || []).map(f => [f.id, f]));
for (const id of ids) {
  if (!known.has(id) || !known.get(id).enabled) fail(`fonctionnalité non autorisée ou désactivée : ${id}`);
  const f = proposed.get(id);
  if (!f || ![f.kicker, f.title].every(v => typeof v === 'string' && v.trim())) fail(`textes incomplets : ${id}`);
}
const changes = proposal.config_changes;
if (!changes?.brand || !changes?.scenes?.problem || !changes?.scenes?.transition) fail('proposition éditoriale incomplète');
const durations = { problem: 6, transition: 5, solution: 7, signature: 10 };
const total = Object.values(durations).reduce((a, b) => a + b, 0);
if (total < 25 || total > 30) fail('durée hors cible');
const renderConfig = structuredClone(base);
renderConfig.brand = { ...base.brand, ...changes.brand };
renderConfig.scenes.problem = { ...base.scenes.problem, ...changes.scenes.problem, duration: durations.problem };
renderConfig.scenes.transition = { ...base.scenes.transition, ...changes.scenes.transition, duration: durations.transition };
renderConfig.scenes.solution = {
  ...base.scenes.solution, duration: durations.solution,
  features: base.scenes.solution.features.map(f => {
    const selected = ids.includes(f.id);
    return selected ? { ...f, ...proposed.get(f.id), enabled: true } : { ...f, enabled: false };
  })
};
renderConfig.scenes.signature = { ...base.scenes.signature, duration: durations.signature, ctaAt: 4.0 };
let cursor = 0;
const voice = changes.voiceover || [];
const scenes = [
  { id: 'problem', type: 'existing-scene', start: cursor, duration: durations.problem, visual: 'Papiers, registres et horloge animés', narration: voice.filter(v => v.scene === 'problem').map(v => v.text) }
];
cursor += durations.problem;
scenes.push({ id: 'transition', type: 'existing-scene', start: cursor, duration: durations.transition, visual: 'Halo, anneaux dorés et révélation du logo Gestilys', narration: voice.filter(v => v.scene === 'solution').map(v => v.text) });
cursor += durations.transition;
const slot = durations.solution / ids.length;
ids.forEach((id, i) => {
  const f = proposed.get(id);
  scenes.push({ id: `feature-${id}`, type: 'existing-ui-animation', feature_id: id, start: cursor + i * slot, duration: slot, kicker: f.kicker, title: f.title, visual_component: id, note: 'Interface illustrative avec données fictives' });
});
cursor += durations.solution;
scenes.push({ id: 'signature', type: 'existing-scene', start: cursor, duration: durations.signature, visual: 'Logo, slogan et carte de contact finale', cta_at: cursor + 4, narration: voice.filter(v => v.scene === 'cta').map(v => v.text) });
const plan = {
  status: 'VISUAL_PLAN_REQUIRES_HUMAN_APPROVAL',
  source_status: proposal.status,
  generated_at: new Date().toISOString(),
  total_duration_seconds: total,
  canvas: { ...base.video, aspect_ratio: '9:16' },
  renderer: 'src/scenes.js — composants et animations existants',
  selected_feature_ids: ids,
  scenes,
  safeguards: [
    'Configuration de production source inchangée.',
    'Aucune fonctionnalité hors liste blanche.',
    'Interfaces illustratives avec données fictives.',
    'Aucun rendu ni publication automatique.',
    'Validation humaine requise avant le rendu.'
  ]
};
await mkdir(new URL('../out/ai-studio/', import.meta.url), { recursive: true });
await writeFile(new URL('../out/ai-studio/scene-plan.json', import.meta.url), JSON.stringify(plan, null, 2) + '\n');
await writeFile(new URL('../out/ai-studio/render-config.json', import.meta.url), JSON.stringify(renderConfig, null, 2) + '\n');
console.log(`VISUAL PLAN OK : ${scenes.length} séquences, ${total}s, ${ids.length} fonctionnalité(s). Aucun rendu lancé.`);
