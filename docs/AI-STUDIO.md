# Gestilys AI Studio

## Chaîne actuelle

1. **Scénariste** — transforme un brief en proposition structurée.
2. **Agent visuel** — crée un plan de scènes et une configuration isolée.
3. **Agent réalisateur** — utilise Playwright/Chromium et FFmpeg pour créer les images et le MP4 sans audio.
4. **Agent audio** — transforme le texte en plan de synchronisation, puis mixe des voix enregistrées et une musique avec FFmpeg.

Chaque étape produit des fichiers séparés dans `out/ai-studio/`. Aucune publication n'est automatique.

## Audio : fonctionnement

Après génération du scénario et du plan visuel :

```bash
npm run ai-studio:audio-plan
```

Le fichier `out/ai-studio/audio-plan.json` indique le texte de chaque phrase, son instant de départ et le nom du fichier audio attendu.

Fournissez les enregistrements autorisés dans `audio/ai-studio/` :

- `voiceover-01.wav`
- `voiceover-02.wav`
- etc., selon le plan audio ;
- facultativement `music.mp3`, `music.wav`, `music.m4a` ou `music.ogg`.

Si aucune musique n'est fournie, FFmpeg peut générer une nappe instrumentale originale :

```bash
AI_STUDIO_AUDIO_APPROVED=1 AI_STUDIO_GENERATE_MUSIC=1 npm run ai-studio:audio-mix
```

Pour mixer avec une musique fournie, omettez `AI_STUDIO_GENERATE_MUSIC`. La sortie est `out/ai-studio/gestilys-video-avec-audio.mp4`.

Le mixeur exige `AI_STUDIO_AUDIO_APPROVED=1`. Il refuse de fonctionner si un enregistrement attendu manque. Il baisse la musique sous la voix, synchronise les segments et ajoute une piste AAC. Le fichier source sans audio n'est pas modifié.

## Voix synthétique et droits

Cette version ne génère pas encore une voix humaine par IA. Elle prépare les textes et synchronise les enregistrements fournis. Utilisez uniquement une voix enregistrée avec consentement ou une voix synthétique dont les conditions autorisent explicitement l'usage commercial et publicitaire. Ne clonez pas la voix d'une personne sans son accord. Ne partagez aucune donnée personnelle d'élève, parent, enseignant ou école.

La génération de voix par un fournisseur externe sera étudiée séparément, après vérification des conditions d'âge, des droits et des coûts. Aucun secret API n'est requis pour les tests actuels.

## Tests sans API

Le workflow **Gestilys AI Studio — test sans API** vérifie le scénario fictif, le plan visuel, l'aperçu Chromium, le plan audio et le mixage FFmpeg. Les fichiers vocaux du test sont des tonalités synthétiques, pas une voix humaine. Le test ne valide donc pas encore la qualité d'une vraie voix off.

## Limites restantes

- Le test audio utilise des tonalités synthétiques, pas les voix finales.
- L'agent audio ne crée pas encore une voix parlée par IA.
- L'agent réalisateur et l'encodeur MP4 complet doivent encore être validés ensemble sur un rendu final de publicité.
- Les personnages 3D et la publication sur les réseaux sociaux ne sont pas encore automatisés.


## Voix française gratuite avec Piper

AI Studio propose une synthèse vocale locale, sans API payante, sans clé et sans carte bancaire. Elle utilise Piper et le modèle français `fr_FR-siwis-medium`. Le premier lancement télécharge le modèle (environ 63 Mo) et nécessite Python :

```bash
python3 -m pip install piper-tts==1.5.0
AI_STUDIO_TTS_APPROVED=1 npm run ai-studio:voice
```

Les fichiers sont écrits dans `out/ai-studio/piper-audio/`, séparément des enregistrements personnels. Le script ne remplace aucun fichier existant par défaut. Écoutez et validez chaque segment avant le mixage :

```bash
AI_STUDIO_AUDIO_DIR=out/ai-studio/piper-audio AI_STUDIO_AUDIO_APPROVED=1 npm run ai-studio:audio-mix
```

**Licence et attribution :** la fiche de `fr_FR-siwis-medium` indique CC BY 4.0 pour le jeu de données et précise un fine-tuning depuis hifi_tts_92 (Hi-Fi TTS, CC BY 4.0). Le script conserve la fiche du modèle dans `VOICE-ATTRIBUTION.txt`. L'attribution et les conditions CC BY 4.0 doivent être respectées. Le moteur Piper est GPL-3.0-or-later et est utilisé comme outil externe. Vérifier la fiche et la chaîne de provenance avant tout usage commercial.

Cette voix n'est pas une voix clonée. N'envoyez aucune donnée personnelle d'élève, parent, enseignant ou école au moteur.

## Limites du mode gratuit

- La voix Piper est réellement générée localement, sans facture par génération ; le modèle doit être téléchargé une première fois.
- La génération vidéo par modèles ouverts (par exemple Wan) reste exigeante en GPU. Les démonstrations publiques gratuites de Hugging Face ZeroGPU ont des quotas quotidiens, des files d'attente et aucune garantie de disponibilité : elles ne constituent pas encore un moteur de production fiable.
- En attendant une solution vidéo gratuite stable, le rendu Playwright/Chromium + FFmpeg reste le moteur garanti du projet. Il produit des animations 2D à partir des scènes existantes, pas des personnages 3D générés.
- Aucun appel Vercel AI Gateway, Veo ou autre API payante n'est requis ni activé dans cette architecture.
