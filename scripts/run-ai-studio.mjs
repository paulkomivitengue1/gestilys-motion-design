// Orchestrateur local de la chaîne AI Studio. Chaque étape reste explicite et contrôlée.
import { spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const stage = process.argv[2];
const commands = {
 prepare: [['scripts/generate-brief.mjs'], ['scripts/plan-scenes.mjs'], ['scripts/create-audio-plan.mjs']],
 preview: [['scripts/render-approved.mjs', { PREVIEW: '1' }]],
 render: [['scripts/render-approved.mjs', { AI_STUDIO_APPROVED: '1' }], ['scripts/encode-ai-studio.sh', {}, 'shell'], ['scripts/verify-ai-studio.sh', {}, 'shell']],
 audio: [['scripts/mix-ai-studio-audio.sh', { AI_STUDIO_AUDIO_APPROVED: '1' }, 'shell']]
};
if (!commands[stage]) { console.error('Usage : node scripts/run-ai-studio.mjs <prepare|preview|render|audio>'); process.exit(2); }
if (stage === 'render' && process.env.AI_STUDIO_APPROVED !== '1') throw new Error('Étape refusée : inspectez et validez le scénario + aperçu, puis relancez avec AI_STUDIO_APPROVED=1.');
if (stage === 'audio' && process.env.AI_STUDIO_AUDIO_APPROVED !== '1') throw new Error('Étape refusée : validez les enregistrements et le plan audio, puis relancez avec AI_STUDIO_AUDIO_APPROVED=1.');
await mkdir(resolve(root, 'out/ai-studio'), { recursive: true });
for (const [file, extra = {}, kind] of commands[stage]) {
 const shell = kind === 'shell';
 const result = spawnSync(shell ? 'bash' : process.execPath, [file], { cwd: root, stdio: 'inherit', env: { ...process.env, ...extra } });
 if (result.error) throw result.error;
 if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('AI STUDIO — étape « ' + stage + ' » terminée.');
