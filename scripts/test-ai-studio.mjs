import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const configPath = new URL('../config/video.config.json', import.meta.url);
const before = await readFile(configPath, 'utf8');
const env = { ...process.env, AI_STUDIO_SELF_TEST: '1', AD_BRIEF: 'Test fictif sans données réelles : présenter Gestilys aux directions d’écoles privées.' };
function run(script, extraEnv = {}) { const r = spawnSync(process.execPath, [script], { encoding: 'utf8', env: { ...env, ...extraEnv } }); if (r.status !== 0) { process.stderr.write(r.stderr || r.stdout); process.exit(r.status || 1); } return r.stdout; }
function runShell(script, extraEnv = {}) { const r = spawnSync('bash', ['-lc', script], { encoding: 'utf8', env: { ...env, ...extraEnv } }); if (r.status !== 0) { process.stderr.write(r.stderr || r.stdout); process.exit(r.status || 1); } return r.stdout; }
run('scripts/generate-brief.mjs'); run('scripts/plan-scenes.mjs'); run('scripts/create-audio-plan.mjs');
run('scripts/render-approved.mjs', { PREVIEW: '1' });
assert.equal(await readFile(configPath, 'utf8'), before, 'La configuration source a été modifiée.');
const proposal = JSON.parse(await readFile('out/ai-studio/proposal.json', 'utf8'));
assert.equal(proposal.status, 'DRAFT_REQUIRES_HUMAN_APPROVAL'); assert.ok(proposal.duration_seconds >= 25 && proposal.duration_seconds <= 30);
const plan = JSON.parse(await readFile('out/ai-studio/scene-plan.json', 'utf8'));
const renderConfig = JSON.parse(await readFile('out/ai-studio/render-config.json', 'utf8'));
assert.equal(plan.status, 'VISUAL_PLAN_REQUIRES_HUMAN_APPROVAL'); assert.equal(plan.total_duration_seconds, 28);
assert.equal(plan.scenes.reduce((sum, s) => sum + s.duration, 0), 28); assert.deepEqual(plan.selected_feature_ids, proposal.selected_feature_ids);
assert.equal(renderConfig.scenes.problem.duration + renderConfig.scenes.transition.duration + renderConfig.scenes.solution.duration + renderConfig.scenes.signature.duration, 28);
assert.deepEqual(renderConfig.scenes.solution.features.filter(f => f.enabled).map(f => f.id), proposal.selected_feature_ids);
assert.ok(plan.scenes.some(s => s.type === 'existing-ui-animation')); assert.ok(plan.safeguards.some(s => s.includes('Validation')));
const audioPlan = JSON.parse(await readFile('out/ai-studio/audio-plan.json', 'utf8'));
assert.equal(audioPlan.status, 'AUDIO_PLAN_REQUIRES_HUMAN_APPROVAL'); assert.equal(audioPlan.duration_seconds, 28); assert.ok(audioPlan.voice.segments.length >= 2);
assert.ok(audioPlan.voice.segments.every((s, i, a) => s.start_seconds >= 0 && s.start_seconds < 28 && (!i || s.start_seconds >= a[i-1].start_seconds)));
assert.match(await readFile('out/ai-studio/scenario.md', 'utf8'), /brouillon à valider humainement/i);
const { readdir, readFile: readBytes } = await import('node:fs/promises');
const previews = (await readdir('out/ai-studio/preview')).filter(n => n.endsWith('.png')); assert.ok(previews.length >= 12);
const png = await readBytes('out/ai-studio/preview/' + previews[0]); assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
// Rendu réel de toutes les scènes, encodage H.264 puis contrôle ffprobe.
run('scripts/render-approved.mjs', { AI_STUDIO_APPROVED: '1' });
runShell('bash scripts/encode-ai-studio.sh'); runShell('bash scripts/verify-ai-studio.sh out/ai-studio/gestilys-video-sans-audio.mp4');
// Le test audio utilise des tonalités synthétiques, jamais présentées comme une voix humaine.
runShell('mkdir -p out/ai-studio/audio-test');
for (let i = 0; i < audioPlan.voice.segments.length; i++) { const id = String(i + 1).padStart(2, '0'); const hz = 440 + i * 80; runShell('ffmpeg -hide_banner -loglevel error -y -f lavfi -i sine=frequency=' + hz + ':duration=1 -ar 48000 -ac 1 out/ai-studio/audio-test/voiceover-' + id + '.wav'); }
runShell('bash scripts/mix-ai-studio-audio.sh', { AI_STUDIO_AUDIO_APPROVED: '1', AI_STUDIO_AUDIO_DIR: 'out/ai-studio/audio-test', AI_STUDIO_GENERATE_MUSIC: '1' });
const mixed = await readBytes('out/ai-studio/gestilys-video-avec-audio.mp4'); assert.ok(mixed.length > 100000);
console.log('SELF-TEST OK : scénario + plan visuel + aperçu + rendu MP4 28s + contrôle ffprobe + mixage AAC vérifiés. Voix de test synthétiques uniquement, aucun appel Gemini.');
