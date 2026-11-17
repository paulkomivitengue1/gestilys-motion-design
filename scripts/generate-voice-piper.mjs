// Génération vocale française locale avec Piper : aucun fournisseur payant ni clé API.
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';

if (process.env.AI_STUDIO_TTS_APPROVED !== '1') {
  throw new Error('Génération bloquée : validez le texte et autorisez la synthèse avec AI_STUDIO_TTS_APPROVED=1.');
}
const planPath = 'out/ai-studio/audio-plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
if (plan.status !== 'AUDIO_PLAN_REQUIRES_HUMAN_APPROVAL') throw new Error('Plan audio non reconnu.');
if (!Array.isArray(plan.voice?.segments) || plan.voice.segments.length < 2) throw new Error('Segments audio insuffisants.');
const voice = 'fr_FR-siwis-medium';
const modelDir = resolve(process.env.PIPER_MODEL_DIR || 'out/ai-studio/piper-voices');
const outputDir = resolve(process.env.AI_STUDIO_AUDIO_DIR || 'out/ai-studio/piper-audio');
const modelPath = join(modelDir, voice + '.onnx');
const configPath = modelPath + '.json';
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(command + ' a échoué (code ' + result.status + ').');
};
await mkdir(modelDir, { recursive: true });
await mkdir(outputDir, { recursive: true });
if (!await exists(modelPath) || !await exists(configPath)) {
  run(process.env.PYTHON || 'python3', ['-m', 'piper.download_voices', voice, '--data-dir', modelDir]);
}
await access(modelPath);
await access(configPath);
const cardUrl = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/MODEL_CARD';
const response = await fetch(cardUrl);
if (!response.ok) throw new Error('Impossible de récupérer la fiche de licence de la voix Piper (HTTP ' + response.status + ').');
const modelCard = await response.text();
await writeFile(join(outputDir, 'VOICE-ATTRIBUTION.txt'),
  'Voix : fr_FR-siwis-medium (Piper)\n' +
  'Fiche du modèle et licence à conserver : ' + cardUrl + '\n' +
  'Licence du jeu de données indiquée par la fiche : CC BY 4.0.\n' +
  'La voix est fine-tunée depuis hifi_tts_92 (Hi-Fi TTS, CC BY 4.0).\n' +
  'Attribuer les contributeurs et respecter les conditions CC BY 4.0.\n' +
  'Moteur Piper : GPL-3.0-or-later (utilisé comme outil externe, non embarqué dans la vidéo).\n\n' +
  modelCard);
for (const segment of plan.voice.segments) {
  const output = join(outputDir, segment.expected_file);
  if (await exists(output) && process.env.AI_STUDIO_TTS_OVERWRITE !== '1') {
    throw new Error('Fichier déjà présent, non écrasé : ' + output + '. Choisissez un dossier neuf ou AI_STUDIO_TTS_OVERWRITE=1.');
  }
  run(process.env.PYTHON || 'python3', ['-m', 'piper', '-m', modelPath, '-f', output, '--', segment.text]);
  const stat = await (await import('node:fs/promises')).stat(output);
  if (stat.size < 1000) throw new Error('Fichier vocal invalide : ' + output);
}
console.log('PIPER TTS OK : ' + plan.voice.segments.length + ' segments français générés dans ' + outputDir);
console.log('Fiche d’attribution conservée dans VOICE-ATTRIBUTION.txt. Écoute et validation humaines requises avant mixage.');
async function exists(path) { try { await access(path); return true; } catch { return false; } }
