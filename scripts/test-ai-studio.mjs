import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const configPath = new URL('../config/video.config.json', import.meta.url);
const before = await readFile(configPath, 'utf8');
const result = spawnSync(process.execPath, ['scripts/generate-brief.mjs'], {
  encoding: 'utf8',
  env: {
    ...process.env,
    AI_STUDIO_SELF_TEST: '1',
    AD_BRIEF: 'Test fictif sans données réelles : présenter Gestilys aux directions d’écoles privées.'
  }
});
if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout);
  process.exit(result.status || 1);
}
const after = await readFile(configPath, 'utf8');
assert.equal(after, before, 'La configuration de production a été modifiée.');
const proposal = JSON.parse(await readFile('out/ai-studio/proposal.json', 'utf8'));
assert.equal(proposal.status, 'DRAFT_REQUIRES_HUMAN_APPROVAL');
assert.ok(proposal.duration_seconds >= 25 && proposal.duration_seconds <= 30);
assert.ok(proposal.config_changes.scenes.solution.features.length > 0);
const scenario = await readFile('out/ai-studio/scenario.md', 'utf8');
assert.match(scenario, /brouillon à valider humainement/i);
assert.match(scenario, /voix off/i);
console.log('SELF-TEST OK : proposition générée, validée, configuration intacte. Aucun appel Gemini.');
