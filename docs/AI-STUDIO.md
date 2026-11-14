# Gestilys AI Studio

## Chaîne actuelle

Le projet comporte trois étapes séparées :

1. **Scénariste** — `scripts/generate-brief.mjs` transforme un brief en proposition structurée.
2. **Agent visuel** — `scripts/plan-scenes.mjs` transforme la proposition en plan de scènes et prépare une configuration de rendu isolée.
3. **Agent réalisateur** — `scripts/render-approved.mjs` lance le moteur Playwright/Chromium existant pour produire des images ou un aperçu. FFmpeg assemble ensuite les images en MP4.

Les sorties IA sont des brouillons et ne sont jamais publiées automatiquement.

## Fichiers produits

Dans `out/ai-studio/` :

- `proposal.json` et `scenario.md` : scénario proposé ;
- `scene-plan.json` : séquençage et indications visuelles ;
- `render-config.json` : copie de configuration dédiée à ce rendu ;
- `preview/` : images clés de l'aperçu ;
- `frames/` : images du rendu complet ;
- `gestilys-video-sans-audio.mp4` : vidéo assemblée, sans piste audio.

La configuration de production `config/video.config.json`, les rendus historiques et les Releases ne sont pas écrasés par ces scripts.

## Tester sans clé API

Le workflow **Gestilys AI Studio — test sans API** s'exécute sur les pushes de la branche `ai-studio-foundation`. Il utilise une réponse fictive locale, vérifie les garde-fous et rend un aperçu Chromium. Aucun appel Gemini n'est effectué.

## Utilisation réelle de Gemini

La génération par Gemini est facultative pour les tests du moteur. Si elle est activée, la clé doit être créée et gérée par une personne autorisée selon les conditions Google applicables. Google AI Studio et Gemini API imposent notamment une condition d'âge minimale de 18 ans. La personne responsable doit consulter les conditions officielles avant toute utilisation : https://aistudio.google.com/docs/terms

La clé ne doit jamais être commitée, copiée dans un brief ou partagée dans une conversation. Elle doit uniquement être enregistrée comme secret GitHub Actions sous le nom `GEMINI_API_KEY`, par la personne responsable. Ne transmettez aucune donnée personnelle d'élève, parent, enseignant ou école au modèle.

## Rendu avec validation humaine

Le réalisateur refuse de démarrer sans `AI_STUDIO_APPROVED=1`. Cette variable doit être définie explicitement après examen du scénario et du plan visuel.

Aperçu :

```bash
AI_STUDIO_APPROVED=1 PREVIEW=1 node scripts/render-approved.mjs
```

Rendu complet :

```bash
AI_STUDIO_APPROVED=1 node scripts/render-approved.mjs
bash scripts/encode-ai-studio.sh
```

Vérification :

```bash
bash scripts/verify-ai-studio.sh
```

Le rendu complet et l'encodage restent isolés dans `out/ai-studio/`. La vidéo produite est sans audio ; le mixage voix/musique est un jalon distinct. Les interfaces affichées dans la publicité sont illustratives et doivent rester identifiées comme telles si elles ne sont pas des captures réelles de l'application.

## Limites actuelles

- Le mode de test utilise une proposition fictive ; il ne valide pas encore la qualité des scénarios générés par Gemini.
- L'aperçu Chromium vérifie le rendu des images clés, pas encore le MP4 complet.
- Le rendu complet, le mixage d'une voix française et la vérification audio devront être testés séparément avant toute utilisation commerciale.
- Aucune publication sur les réseaux sociaux n'est automatique.
