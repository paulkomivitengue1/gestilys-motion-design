# Gestilys — campagne motion design verticale

Une publicité verticale **originale de 28 secondes**, conçue pour Gestilys : 1080 × 1920 (9:16), 30 images/s, MP4 H.264 avec piste AAC. La nouvelle création utilise une direction artistique bleu-encre / or, une typographie cinétique, des documents qui se recomposent en tableau de bord, des interfaces fictives, des cartes en profondeur, un emblème G dessiné en lumière et une conclusion dédiée à l'appel à l'action.

## Livrables

- `gestilys-campagne-28s-1080x1920.mp4` — master final vertical, H.264/AAC.
- `out/gestilys-pub-whatsapp.mp4` — version de partage plus légère (créée au rendu local; le dossier `out/` est ignoré par Git).
- Sources déterministes sous `src/`, `scripts/` et `config/`.

La vidéo est produite à partir de **840 images calculées par Canvas 2D/Skia** et encodée par FFmpeg. Aucune vidéo stock, image préfabriquée, API distante ou musique sous licence tierce n'est utilisée. La partition synthétique `scripts/make-score.mjs` est créée par le projet (arpèges, nappes harmoniques et impulsions discrètes); elle est facultative.

## Direction artistique et scénario

| Temps | Mouvement | Idée |
|---|---|---|
| 0–5 s | Impact | Orbites, poussières lumineuses, fragments documentaires et arrivée des mots « GÉRER UNE ÉCOLE NE DEVRAIT PAS ÊTRE COMPLIQUÉ. » |
| 5–11 s | Du désordre à l'ordre | Listes, paiements, reçus et notes volent, se réduisent, se rangent dans un noyau lumineux; « TOUT RASSEMBLER CHANGE TOUT. » |
| 11–19 s | Solution | Interface scolaire illustrée en profondeur : élèves/classes, paiements suivis, progression graphique, reçu et bulletin. Statistiques fictives, sans témoignage ni promesse de résultat. |
| 19–25 s | Identité | Le G se trace dans une composition de rayons, d'orbites et de particules; « Gestilys — La gestion scolaire, simplifiée. » |
| 25–28 s | Conclusion | Logo, « VOTRE ÉCOLE, MIEUX ORGANISÉE. » et « DEMANDEZ UNE DÉMONSTRATION. », avec une sortie douce. |

Les données présentées dans l'interface sont fictives et la mention « Écrans illustratifs · données fictives » est affichée. La maquette de reçu est incluse comme demandé pour ce concept publicitaire; vérifie qu'elle correspond bien à une fonction disponible dans le produit avant diffusion. L'écran d'inscriptions, non confirmé, n'est pas présenté.

## Générer la vidéo en local

Prérequis : Node.js 22, npm et FFmpeg/FFprobe. Le dépôt embarque Canvas/Skia précompilé et DM Sans via les dépendances npm; aucune installation Chromium n'est nécessaire.

```bash
npm ci
npm run check
npm run preview          # images clés, dans out/preview/
npm run render           # 840 PNG dans frames/
bash scripts/encode.sh   # master vidéo sans audio
GENERATE_MUSIC=1 bash scripts/mux.sh
bash scripts/verify.sh out/gestilys-pub-1080x1920.mp4
```

Les PNG intermédiaires et vidéos de travail sont ignorés par Git (`frames/`, `out/`, `build/`). Le rendu complet peut être relancé : pour une même configuration, les images, la timeline et la partition musicale sont déterministes.

Pour contrôler l'animation dans un navigateur, lancer un serveur à la racine du dépôt et ouvrir `/src/` (le fichier `src/index.html` expose pause, lecture et scrub).

## GitHub Actions

Le workflow **Rendre la publicité Gestilys** (`.github/workflows/render-video.yml`) est manuel : Actions → workflow → Run workflow.

- `mode = apercu` rend un lot d'images clés.
- `mode = video` rend et encode les 840 images, ajoute par défaut la partition originale, puis valide les deux MP4.
- Les fichiers sont téléchargeables comme artefacts; l'option Release publie aussi le master, la version WhatsApp et le master sans audio.

Le workflow utilise les mêmes scripts et les mêmes contrôles que la génération locale. La dépendance de rendu est `@napi-rs/canvas`; FFmpeg est fourni par l'exécuteur Ubuntu. Aucune licence commerciale Remotion, API payante ou service de génération externe n'est requis.

## Structure

```
config/video.config.json       palette, marque, 5 scènes et minutage
src/scenes.js                  moteur Canvas 2D déterministe des scènes
src/index.html                 aperçu temps réel avec commandes
src/styles.css                 interface de l'aperçu
scripts/render.mjs             rendu des PNG, sélection d'aperçu ou 840 images
scripts/encode.sh              assemblage H.264
scripts/mux.sh                 AAC, partition/voix optionnelles et version légère
scripts/make-score.mjs         partition instrumentale originale, générée en PCM
scripts/verify.sh               vérification codec, taille, cadence et durée
.github/workflows/             rendu, vérification, artefacts et Releases
```

## Ce qui change par rapport à l'ancien export

Le dépôt ne contient pas les anciennes vidéos, mais le code source confirme une structure antérieure de 37 s en quatre scènes, avec un premier texte affiché sur des feuilles et post-its superposés, une séquence intermédiaire de transition indépendante, puis les interfaces montrées une à une dans de grands panneaux frontaux et une longue signature de marque. La nouvelle campagne n'est pas une recoloration de cette version : elle resserre le récit en cinq actes de 28 s, introduit un motif récurrent d'orbites et de lumière, transforme graphiquement le désordre en système, compose un tableau de bord plus riche et superposé, et distingue clairement la révélation d'identité du carton d'appel à l'action.
