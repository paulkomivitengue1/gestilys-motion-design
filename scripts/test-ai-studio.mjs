import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const configPath = new URL('../config/video.config.json', import.meta.url);
const before = await readFile(configPath, 'utf8');
const env = { ...process.env, AI_STUDIO_SELF_TEST: '1', AD_BRIEF: 'Test fictif sans données réelles : présenter Gestilys aux directions d’écoles privées.' };
function run(script, extraEnv = {}) {
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8', env: { ...env, ...extraEnv } });
  if (result.status !== 0) { process.stderr.write(result.stderr || result.stdout); process.exit(result.status || 1); }
  return result.stdout;
}
function runShell(script, extraEnv = {}) {
  const result = spawnSync('bash', ['-lc', script], { encoding: 'utf8', env: { ...env, ...extraEnv } });
  if (result.status !== 0) { process.stderr.write(result.stderr || result.stdout); process.exit(result.status || 1); }
  return result.stdout;
}
run('scripts/generate-brief.mjs');
run('scripts/plan-scenes.mjs');
run('scripts/create-audio-plan.mjs');
run('scripts/render-approved.mjs', { AI_STUDIO_APPROVED: '1', PREVIEW: '1' });
assert.equal(await readFile(configPath, 'utf8'), before, 'La configuration source a été modifiée.');
const proposal = JSON.parse(await readFile('out/ai-studio/proposal.json', 'utf8'));
assert.equal(proposal.status, 'DRAFT_REQUIRES_HUMAN_APPROVAL');
assert.ok(proposal.duration_seconds >= 25 && proposal.duration_seconds <= 30);
const plan = JSON.parse(await readFile('out/ai-studio/scene-plan.json', 'utf8'));
const renderConfig = JSON.parse(await readFile('out/ai-studio/render-config.json', 'utf8'));
assert.equal(plan.status, 'VISUAL_PLAN_REQUIRES_HUMAN_APPROVAL');
assert.equal(plan.total_duration_seconds, 28);
assert.equal(plan.scenes.reduce((sum, scene) => sum + scene.duration, 0), 28);
assert.deepEqual(plan.selected_feature_ids, proposal.selected_feature_ids);
assert.equal(renderConfig.scenes.problem.duration + renderConfig.scenes.transition.duration + renderConfig.scenes.solution.duration + renderConfig.scenes.signature.duration, 28);
assert.deepEqual(renderConfig.scenes.solution.features.filter(f => f.enabled).map(f => f.id), proposal.selected_feature_ids);
assert.ok(plan.scenes.some(scene => scene.type === 'existing-ui-animation'));
assert.ok(plan.safeguards.some(item => item.includes('Validation humaine') || item.includes('Validation')));
const audioPlan = JSON.parse(await readFile('out/ai-studio/audio-plan.json', 'utf8'));
assert.equal(audioPlan.status, 'AUDIO_PLAN_REQUIRES_HUMAN_APPROVAL');
assert.equal(audioPlan.duration_seconds, 28);
assert.ok(audioPlan.voice.segments.length >= 2);
assert.ok(audioPlan.voice.segments.every((segment, i, arr) => segment.start_seconds >= 0 && segment.start_seconds < 28 && (!i || segment.start_seconds >= arr[i-1].start_seconds)));
assert.match(await readFile('out/ai-studio/scenario.md', 'utf8'), /brouillon à valider humainement/i);
const { readdir, readFile: readBytes } = await import('node:fs/promises');
const previewFiles = (await readdir('out/ai-studio/preview')).filter(name => name.endsWith('.png'));
assert.ok(previewFiles.length >= 12, 'L’aperçu doit contenir au moins 12 images clés.');
const png = await readBytes('out/ai-studio/preview/' + previewFiles[0]);
assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Le fichier aperçu n’est pas un PNG valide.');
// Test audio entièrement synthétique : aucune voix humaine, aucun contenu tiers.
runShell('mkdir -p out/ai-studio/audio-test');
runShell('ffmpeg -hide_banner -loglevel error -y -f lavfi -i color=c=0x0A1F44:s=1080x1920:r=30:d=28 -an -c:v libx264 -preset ultrafast -pix_fmt yuv420p out/ai-studio/gestilys-video-sans-audio.mp4');
for (let i = 0; i < audioPlan.voice.segments.length; i++) {
  const id = String(i + 1).padStart(2, '0');
  const frequency = 440 + i * 80;
  runShell(`ffmpeg -hide_banner -loglevel error -y -f lavfi -i "sine=frequency=${frequency}:duration=1" -ar 48000 -ac 1 out/ai-studio/audio-test/voiceover-${id}.wav`);
}
runShell('scripts/mix-ai-studio-audio.sh', { AI_STUDIO_AUDIO_APPROVED: '1', AI_STUDIO_AUDIO_DIR: 'out/ai-studio/audio-test', AI_STUDIO_GENERATE_MUSIC: '1' });
const mixed = await readBytes('out/ai-studio/gestilys-video-avec-audio.mp4');
assert.ok(mixed.length > 100000, 'MP4 avec audio trop petit ou vide.');
console.log('SELF-TEST OK : scénario + plan visuel + aperçu Chromium + plan audio + mixage FFmpeg vérifiés. Voix de test synthétiques uniquement, aucun appel Gemini.');
