// Agent scénariste Gestilys AI Studio — génère une proposition, sans modifier la config de production.
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const brief = process.env.AD_BRIEF?.trim();
const selfTest = process.env.AI_STUDIO_SELF_TEST === '1';
const apiKey = process.env.GEMINI_API_KEY;
const model = selfTest ? 'mock-self-test' : (process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash');
if (!brief) throw new Error('Brief manquant : renseignez AD_BRIEF.');
if (!selfTest && !apiKey) throw new Error('Secret GEMINI_API_KEY absent. Ajoutez-le dans Settings > Secrets and variables > Actions.');
if (brief.length > 6000) throw new Error('Brief trop long : 6 000 caractères maximum.');

const config = JSON.parse(await readFile(new URL('../config/video.config.json', import.meta.url), 'utf8'));
const allowed = config.scenes.solution.features.filter(f => f.enabled).map(f => ({
  id: f.id, kicker: f.kicker, title: f.title
}));
const prompt = `
Tu es le scénariste publicitaire de Gestilys, logiciel de gestion scolaire destiné aux directions d'écoles privées en Afrique de l'Ouest.
Rédige une publicité honnête en français. N'invente aucune fonction, statistique, promesse, témoignage, prix ou garantie.
Le brief utilisateur est une intention, pas une preuve de fonctionnalité.
Fonctionnalités réellement autorisées à montrer (liste blanche) :
${JSON.stringify(allowed)}
Les écrans utilisent des données fictives et doivent conserver la mention : "${config.brand.disclaimer}".
Conserve le format vertical 9:16, le style professionnel et le CTA de demande de démonstration.
Durée cible : 25 à 30 secondes. Propose un texte oral naturel, environ 45 à 65 mots.
Le résultat doit être UNIQUEMENT un objet JSON valide, sans Markdown, avec exactement cette structure :
{
 "brand": {"tagline": "…", "cta": "…"},
 "problem": {"headline": ["…","…"], "notes": ["…"]},
 "transition": {"headline": ["…"]},
 "features": [{"id":"students","kicker":"…","title":"…"}],
 "voiceover": [{"scene":"problem","text":"…"},{"scene":"solution","text":"…"},{"scene":"cta","text":"…"}],
 "duration_seconds": 28,
 "rationale": "…"
}
Règles : features doit contenir uniquement des identifiants de la liste blanche, sans doublons. Ne change jamais les fonctionnalités autorisées. N'écris pas de chiffres non présents dans le brief.
Brief :
${brief}
`;
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
let draft;
if (selfTest) {
  const firstAllowed = allowed[0];
  if (!firstAllowed) throw new Error('Aucune fonctionnalité activée pour le test.');
  draft = {
    brand: { tagline: 'Votre école, mieux organisée.', cta: 'Demandez une démonstration' },
    problem: { headline: ['La gestion scolaire prend du temps'], notes: ['Listes', 'Suivi administratif'] },
    transition: { headline: ['Simplifiez votre quotidien'] },
    features: [{ id: firstAllowed.id, kicker: firstAllowed.kicker, title: firstAllowed.title }],
    voiceover: [
      { scene: 'problem', text: 'La gestion quotidienne demande du temps.' },
      { scene: 'solution', text: 'Gestilys rassemble vos outils de gestion scolaire.' },
      { scene: 'cta', text: 'Demandez une démonstration.' }
    ],
    duration_seconds: 28,
    rationale: 'Fixture locale de test : aucune réponse IA réelle.'
  };
} else {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.55 }
    })
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1200);
    throw new Error(`Gemini API ${response.status}: ${detail}`);
  }
  const payload = await response.json();
  const raw = payload.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
  if (!raw) throw new Error('Gemini n’a retourné aucun contenu exploitable.');
  try { draft = JSON.parse(raw); } catch { throw new Error('La réponse IA n’est pas un JSON valide.'); }
}

const fail = message => { throw new Error(`Proposition refusée : ${message}`); };
if (!draft.brand || typeof draft.brand.tagline !== 'string' || typeof draft.brand.cta !== 'string') fail('brand incomplet');
if (!draft.problem || !Array.isArray(draft.problem.headline) || !Array.isArray(draft.problem.notes)) fail('séquence problème invalide');
if (!draft.transition || !Array.isArray(draft.transition.headline)) fail('transition invalide');
if (!Array.isArray(draft.features) || draft.features.length < 1) fail('aucune fonctionnalité');
if (!Array.isArray(draft.voiceover) || draft.voiceover.length < 2) fail('voix off incomplète');
if (!Number.isInteger(draft.duration_seconds) || draft.duration_seconds < 25 || draft.duration_seconds > 30) fail('durée hors cible 25–30 secondes');

const allowedIds = new Set(allowed.map(f => f.id));
const seen = new Set();
for (const feature of draft.features) {
  if (!allowedIds.has(feature.id)) fail(`fonctionnalité non autorisée : ${feature.id}`);
  if (seen.has(feature.id)) fail(`fonctionnalité répétée : ${feature.id}`);
  seen.add(feature.id);
  if (![feature.kicker, feature.title].every(v => typeof v === 'string' && v.trim())) fail(`texte incomplet pour ${feature.id}`);
}
for (const [name, list, max] of [
  ['problem.headline', draft.problem.headline, 3],
  ['problem.notes', draft.problem.notes, 5],
  ['transition.headline', draft.transition.headline, 3]
]) {
  if (list.length < 1 || list.length > max || !list.every(v => typeof v === 'string' && v.trim())) fail(name + ' invalide');
}
if (!draft.voiceover.every(v => v && ['problem','solution','cta'].includes(v.scene) && typeof v.text === 'string' && v.text.trim())) fail('voix off contient une entrée invalide');

const proposal = {
  generated_at: new Date().toISOString(),
  model,
  brief,
  status: 'DRAFT_REQUIRES_HUMAN_APPROVAL',
  selected_feature_ids: draft.features.map(f => f.id),
  duration_seconds: draft.duration_seconds,
  rationale: String(draft.rationale || ''),
  config_changes: {
    brand: { ...config.brand, tagline: draft.brand.tagline, cta: draft.brand.cta },
    scenes: {
      ...config.scenes,
      problem: { ...config.scenes.problem, headline: draft.problem.headline, notes: draft.problem.notes },
      transition: { ...config.scenes.transition, headline: draft.transition.headline },
      solution: {
        ...config.scenes.solution,
        features: config.scenes.solution.features.map(existing => {
          const replacement = draft.features.find(f => f.id === existing.id);
          return replacement ? { ...existing, kicker: replacement.kicker, title: replacement.title } : existing;
        })
      }
    },
    voiceover: draft.voiceover
  }
};
await mkdir('out/ai-studio', { recursive: true });
await writeFile('out/ai-studio/proposal.json', JSON.stringify(proposal, null, 2) + '\n');
const md = [
  '# Proposition de publicité — Gestilys',
  '',
  '**Statut : brouillon à valider humainement. Aucun rendu ni publication automatique.**',
  '',
  `Durée cible : ${proposal.duration_seconds} secondes`,
  '',
  '## Voix off',
  ...draft.voiceover.map(v => `- **${v.scene}** : ${v.text}`),
  '',
  '## Fonctionnalités retenues',
  ...draft.features.map(f => `- **${f.kicker}** — ${f.title}`),
  '',
  '## Justification',
  proposal.rationale
].join('\n');
await writeFile('out/ai-studio/scenario.md', md + '\n');
console.log('Proposition créée et validée structurellement. La configuration de production reste inchangée.');
