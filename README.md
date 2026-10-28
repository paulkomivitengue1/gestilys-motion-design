# gestilys-motion-design

Publicité vidéo verticale (MP4, 9:16, 1080 × 1920, ~37 s) pour **Gestilys**, logiciel de gestion scolaire.
Tout se fait depuis un téléphone : GitHub dans Chrome, aucun logiciel à installer, coût 0 FCFA.

## Obtenir la vidéo (depuis Chrome sur Android)

1. Ouvre le dépôt sur GitHub → onglet **Actions**.
2. Choisis **Rendre la publicité Gestilys** → **Run workflow**.
   - `mode = apercu` : en quelques minutes, quelques images clés (PNG) pour juger le design.
   - `mode = video` : le MP4 complet (compte environ 10 à 25 min).
3. Quand le rond devient vert, ouvre l'exécution :
   - **Release** (recommandé) : lien dans le résumé de l'exécution, puis onglet **Releases** du dépôt → touche le fichier `.mp4` pour le télécharger directement.
   - ou section **Artifacts** en bas de la page de l'exécution (MP4 direct, ou archive ZIP de secours).
4. Fichiers produits :
   - `gestilys-pub-1080x1920.mp4` : qualité maître (piste audio AAC toujours présente, même sans voix off).
   - `gestilys-pub-whatsapp.mp4` : même vidéo, plus légère pour WhatsApp.
   - `gestilys-video-sans-audio.mp4` : vidéo maître sans audio, réutilisée pour ajouter la voix off plus tard.

Si une étape échoue (croix rouge), ouvre-la : les messages d'erreur sont affichés en clair dans le journal.

## Modifier textes, couleurs, durées

Ouvre `config/video.config.json` dans GitHub → icône crayon → modifie → **Commit changes**.
Le workflow vérifie la configuration avant le rendu et affiche les erreurs.

- `colors` : bleu marine, blanc, orange doré (codes `#RRGGBB`).
- `brand` : nom, descriptif, slogan, appel à l'action (`cta`), mention « écrans illustratifs ».
- `scenes.*.duration` : durée de chaque séquence en secondes (total conseillé : 30 à 40 s).
- `scenes.solution.features` : écrans montrés dans la séquence 3.

### Fonctionnalités présentées (important)

Chaque écran correspond à une fonctionnalité du logiciel. Mets `"enabled": true` **uniquement** pour celles qui existent réellement dans Gestilys :

| id | écran | état par défaut |
|---|---|---|
| `students` | Élèves et classes | activé |
| `payments` | Suivi des paiements (tranches) | activé |
| `report` | Bulletins scolaires | activé |
| `enrollment` | Inscriptions | désactivé (à confirmer) |
| `receipts` | Reçus de paiement | désactivé (à confirmer) |

Les écrans utilisent des **données fictives** (noms, montants) et la vidéo affiche la mention « Écrans illustratifs · données fictives ». Aucune statistique, aucun témoignage, aucun résultat chiffré n'est affiché.
Si tu changes le nombre d'écrans, la durée de chacun s'adapte (`scenes.solution.duration` ÷ nombre d'écrans) ; adapte aussi le texte de la voix off (`voiceover/script.md`).

## Voix off et musique (facultatives)

La vidéo se rend **sans** voix off ni musique. Pour les ajouter plus tard, sans refaire les images :

1. Dépose les fichiers dans le dossier `audio/` (GitHub → `audio` → **Add file → Upload files**) — détails dans `audio/README.md`.
2. Actions → **Ajouter la voix off et la musique** → Run workflow (≈ 2 min).

Le texte à enregistrer, le découpage temporel et la méthode d'obtention (avec vérification des droits) sont dans `voiceover/script.md`.

## Pourquoi cette méthode

Chromium (Playwright) affiche la page HTML/CSS `src/`, on avance le temps image par image (résultat identique à chaque rendu), puis FFmpeg assemble le MP4 sur un exécuteur Ubuntu de GitHub Actions.

- **Remotion** (alternative React) : licence gratuite pour une organisation à but lucratif de 3 personnes maximum, licence payante au-delà (conditions officielles consultées le 28/10/2026 : remotion.dev/license). Il faut donc que tu puisses garantir le seuil des 3 personnes, y compris les freelances. Playwright + FFmpeg n'imposent aucune condition de ce type, d'où ce choix : moins de risque pour un usage commercial.
- **GitHub Actions** : gratuit pour les exécuteurs Linux standard dans un dépôt **public** (docs.github.com, consultée le 28/10/2026). Ne passe pas ce dépôt en privé et n'utilise pas d'exécuteurs « larger », qui sont toujours payants.
- Les artefacts et journaux sont conservés 14 jours (réglable : `retention-days` dans les workflows ; les Releases, elles, restent).
- Le rendu n'utilise aucune API payante ni service externe : dépendances `playwright` (1.49.1) et `ffmpeg` (paquet Ubuntu).

## Structure

```
config/video.config.json      textes, couleurs, durées, fonctionnalités, minutage de la voix
src/                          scène HTML/CSS/JS (animations pilotées par le temps)
scripts/render.mjs            capture image par image (Chromium)
scripts/encode.sh             assemblage H.264 (vidéo maître sans audio)
scripts/mux.sh                mixage voix off + musique, versions finale et WhatsApp
scripts/verify.sh             contrôle 1080×1920, H.264, AAC, durée
scripts/make-music.sh         nappe musicale libre de droits générée (facultative)
audio/                        voix off et musique à déposer
voiceover/script.md           texte, minutage et droits de la voix off
.github/workflows/            rendu complet / aperçu, ajout de l'audio
```
