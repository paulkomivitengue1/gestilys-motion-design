import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const configPath = new URL('../config/video.config.json', import.meta.url);
const before = await readFile(configPath, 'utf8');
const env = { ...process.env, AI_STUDIO_SELF_TEST: '1', AD_BRIEF: 'Test fictif sans données réelles : présenter Gestilys aux directions d’écoles privées.' };
function run(script) {
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8', env });
  if (result.status !== 0) { process.stderr.write(result.stderr || result.stdout); process.exit(result.status || 1); }
  return result.stdout;
}
run('scripts/generate-brief.mjs');
run('scripts/plan-scenes.mjs');
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
assert.match(await readFile('out/ai-studio/scenario.md', 'utf8'), /brouillon à valider humainement/i);
console.log('SELF-TEST OK : scénario + plan visuel + configuration de rendu validés. Source intacte, aucun appel Gemini, aucun rendu.');
