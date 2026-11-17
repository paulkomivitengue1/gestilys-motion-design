// Agent audio : transforme les textes du scénario en feuille de synchronisation.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const proposal = JSON.parse(await readFile('out/ai-studio/proposal.json', 'utf8'));
const visual = JSON.parse(await readFile('out/ai-studio/scene-plan.json', 'utf8'));
if (proposal.status !== 'DRAFT_REQUIRES_HUMAN_APPROVAL') throw new Error('Scénario non reconnu.');
if (visual.status !== 'VISUAL_PLAN_REQUIRES_HUMAN_APPROVAL') throw new Error('Plan visuel non reconnu.');
const cues = { problem: 0, solution: 6, cta: 18 };
const groups = { problem: [], solution: [], cta: [] };
for (const line of proposal.config_changes.voiceover) {
  if (!groups[line.scene]) throw new Error('Séquence vocale inconnue.');
  groups[line.scene].push(line.text.trim());
}
const plan = [];
let index = 1;
for (const scene of ['problem', 'solution', 'cta']) {
  const lines = groups[scene];
  lines.forEach((text, i) => {
    const cue = cues[scene] + (i * (scene === 'problem' ? 6 : scene === 'solution' ? 12 : 10) / Math.max(lines.length, 1));
    plan.push({
      id: String(index).padStart(2, '0'),
      scene,
      start_seconds: Number(cue.toFixed(2)),
      expected_file: `voiceover-${String(index).padStart(2, '0')}.wav`,
      text,
      requires_human_recording_or_licensed_voice: true
    });
    index++;
  });
}
if (plan.length < 2) throw new Error('Au moins deux segments de voix sont nécessaires.');
const output = {
  status: 'AUDIO_PLAN_REQUIRES_HUMAN_APPROVAL',
  duration_seconds: visual.total_duration_seconds,
  voice: { language: 'fr', segments: plan },
  music: { optional: true, generated_by: 'scripts/make-music.sh', commercial_note: 'Musique synthétisée par ce projet ; écoute et validation humaine requises.' },
  safeguards: [
    'Aucune voix humaine clonée ou synthétisée sans consentement et droits appropriés.',
    'Les fichiers voix doivent être enregistrés ou fournis avec autorisation d’utilisation.',
    'Aucun audio ni rendu final n’est publié automatiquement.',
    'Validation humaine requise avant le mixage.'
  ]
};
await mkdir('out/ai-studio', { recursive: true });
await writeFile('out/ai-studio/audio-plan.json', JSON.stringify(output, null, 2) + '\n');
console.log(`AUDIO PLAN OK : ${plan.length} segments, durée ${visual.total_duration_seconds}s. Voix à fournir et validation requise.`);
