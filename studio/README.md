# Studio v3 — publicité Gestilys (28 s, 1080×1920)

Nouveau moteur de motion design, indépendant de l'ancien (`src/`, `scripts/render.mjs`, `config/`), qui reste intact.

## Principe
- `studio/index.html` + `engine.js` + `scenes.js` : une page dont **chaque image est calculée par le code** à partir du temps `t` (`window.seek(t)`).
- **Canvas 2D avec projection 3D calculée** : grille en perspective, polyhèdres filaires en rotation, anneaux inclinés, ~260 particules en profondeur, « G » tracé par particules et ligne lumineuse.
- **DOM en CSS 3D réel** (`perspective`, `translateZ`, `rotateX/Y/Z`) : cartes d'interface, feuilles, typographie cinétique lettre par lettre.
- Aucune dépendance réseau, aucune API payante. Musique originale synthétisée par `scripts/studio-music.mjs` (120 BPM, transitions sur les temps).
- Les textes, couleurs et modules d'interface (`features`) se règlent dans `studio/config.json`.

## Scénario
| Temps | Scène |
|---|---|
| 0–5 s | Impact : « GÉRER UNE ÉCOLE NE DEVRAIT PAS ÊTRE COMPLIQUÉ. », tunnel en perspective, explosion des lettres |
| 5–11 s | Problème : chaos de documents, balayage doré, ordre, « TOUT RASSEMBLER CHANGE TOUT. », aspiration dans un anneau |
| 11–19 s | Solution : tableau de bord, élèves & classes, paiements, reçus, bulletins (cartes 3D, compteurs) |
| 19–25 s | Identité : logo par particules, mot-symbole, slogan |
| 25–28 s | Conclusion : « VOTRE ÉCOLE, MIEUX ORGANISÉE. », appel à l'action, fondu final |

Données des écrans : entièrement fictives (mention « Écrans illustratifs · données fictives » dans la vidéo).

## Produire la vidéo
- **GitHub Actions** : copier `installer-workflows/studio-render.yml` vers `.github/workflows/studio-render.yml` (l'application Claude n'a pas le droit d'écrire dans ce dossier), puis Actions → « Studio — rendre la publicité Gestilys » → Run workflow.
- **En local** : `npm install && npx playwright install chromium`, puis `node scripts/studio-qa.mjs`, `node scripts/studio-render.mjs`, `bash scripts/studio-build.sh`, `bash scripts/studio-verify.sh`.
- Sorties : `out/gestilys-studio-1080x1920.mp4` (maître) et `out/gestilys-studio-whatsapp.mp4` (allégé).
