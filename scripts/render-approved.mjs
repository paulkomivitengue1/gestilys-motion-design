// Agent réalisateur : exécute le moteur existant sur une configuration isolée.
// L'aperçu est libre ; le rendu complet exige un accord humain explicite.
import { spawnSync } from 'node:child_process';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';

const preview = process.env.PREVIEW === '1';
if (!preview && process.env.AI_STUDIO_APPROVED !== '1') {
  throw new Error('Rendu complet bloqué : définissez AI_STUDIO_APPROVED=1 après inspection et validation humaine du scénario et de l’aperçu.');
}
const root = resolve(new URL('..', import.meta.url).pathname);
const planPath = resolve(root, 'out/ai-studio/scene-plan.json');
const configPath = resolve(root, 'out/ai-studio/render-config.json');
const plan = JSON.parse(await readFile(planPath, 'utf8'));
await access(configPath, constants.R_OK);
if (plan.status !== 'VISUAL_PLAN_REQUIRES_HUMAN_APPROVAL') throw new Error('Statut du plan visuel inattendu.');
if (!Number.isFinite(plan.total_duration_seconds) || plan.total_duration_seconds < 25 || plan.total_duration_seconds > 30) throw new Error('Durée du plan visuel hors limites (25–30 secondes).');
const framesDir = preview ? 'out/ai-studio/preview' : 'out/ai-studio/frames';
const result = spawnSync(process.execPath, ['scripts/render.mjs'], { cwd: root, stdio: 'inherit', env: { ...process.env, VIDEO_CONFIG_PATH: 'out/ai-studio/render-config.json', FRAMES_DIR: framesDir, PREVIEW: preview ? '1' : '0' } });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(preview ? 'APERÇU RENDU dans out/ai-studio/preview — inspection humaine requise avant le rendu complet.' : 'IMAGES DU RENDU COMPLET prêtes dans out/ai-studio/frames.');
