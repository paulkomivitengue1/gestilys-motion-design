# Guide : enregistrer la voix off avec un Samsung (Android) et l’ajouter au projet

Tout se fait depuis le téléphone, sans ordinateur et sans application payante. Le texte à dire (10 phrases) est dans `voiceover/script.md`.

## 1. Préparer l’enregistrement

- Pièce calme et peu sonore : rideaux, canapé ou lit (ça absorbe l’écho). Ferme les fenêtres, coupe ventilateur et télévision.
- Active « Ne pas déranger » (ou le mode avion) pour éviter une sonnerie ou une vibration pendant la prise.
- Tiens le téléphone à 15–20 cm de la bouche, micro (en bas du téléphone) dirigé vers toi, sans le toucher pendant que tu parles. Pose-le sur un livre si tu peux : ça évite les bruits de main.
- Prépare un verre d’eau. Lis chaque phrase à voix haute une fois avant d’enregistrer.
- Ton : chaleureux, posé, souriant, comme si tu parlais à un directeur d’école en face de toi. Pas de ton « publicité criée ».
- Dis « 7 jours » comme « sept jours » et « WhatsApp » toujours de la même façon dans toute la vidéo.

## 2. Enregistrer avec l’Enregistreur vocal Samsung

1. Ouvre l’application **Enregistreur vocal** (Samsung). Garde le mode **Standard**.
2. Si les paramètres de l’application proposent une qualité ou un format, choisis la meilleure qualité, en **m4a** (selon la version d’Android, les menus peuvent différer légèrement).
3. Appuie sur le bouton rouge. Attends **1 seconde** en silence, dis **une seule phrase**, attends encore **1 seconde**, puis arrête.
4. Réécoute (idéalement avec des écouteurs). Si la phrase est hachée, trop rapide, trop longue (voir « durée max. » dans le tableau) ou parasitée, supprime-la et refais une prise.
5. Un enregistrement par phrase : 10 fichiers au total.

Conseil de durée : une phrase ne doit pas dépasser son créneau (colonne « Durée max. »). Si elle dépasse, redis-la un peu plus vite, sans bafouiller.

## 3. Renommer les fichiers (important)

Le projet reconnaît les fichiers à leur nom exact :

| Phrase | Nom du fichier |
|---|---|
| 01 | `voiceover-01.m4a` |
| 02 | `voiceover-02.m4a` |
| … | … |
| 09 | `voiceover-09.m4a` |
| 10 | `voiceover-10.m4a` |

Dans l’Enregistreur vocal : ouvre la liste, appui long sur l’enregistrement, **Renommer**, tape `voiceover-01` (l’application ajoute normalement `.m4a`). Vérifie ensuite dans **Mes fichiers** (dossier des enregistrements) que le nom complet est bien `voiceover-01.m4a` et pas `voiceover-01.m4a.m4a`. Zéro majuscule, zéro espace.

Les formats m4a, mp3, wav, aac, ogg, opus, flac et 3gp sont acceptés, à condition que l’extension du nom corresponde au vrai format du fichier.

## 4. Ajouter les fichiers au dépôt GitHub (branche `v2-voix-cta`)

1. Dans Chrome, ouvre `github.com/paulkomivitengue1/gestilys-motion-design`.
2. Touche le sélecteur de branche (il affiche `main`) et choisis **`v2-voix-cta`**. Ne travaille pas sur `main`.
3. Ouvre le dossier **`audio`**.
4. Touche **Add file → Upload files**, puis « choisir vos fichiers » et sélectionne les 10 fichiers `voiceover-NN.m4a` (le sélecteur Android ouvre Mes fichiers ou l’Enregistreur vocal).
   Si « Upload files » n’apparaît pas, passe Chrome en **Version pour ordinateur** (menu ⋮).
5. En bas, laisse « Commit directly to the **v2-voix-cta** branch » coché, puis **Commit changes**.

Fichiers trop lourds ? Le téléversement par navigateur accepte des fichiers jusqu’à 25 Mo chacun : une phrase de quelques secondes pèse bien moins que 1 Mo.

## 5. Mixer la voix (et la musique) dans la vidéo

Le mixage n’a pas besoin de refaire les images : il reprend la vidéo sans audio de la dernière Release.

1. Il faut d’abord qu’une **Release v2** existe (rendu complet de la branche `v2-voix-cta` avec `publish_release` activé).
2. Onglet **Actions** → **Ajouter la voix off et la musique** → **Run workflow**.
3. Dans « Use workflow from », choisis la branche **`v2-voix-cta`** (sinon ce sont les fichiers de `main` qui sont lus).
4. Dans `source_tag`, tape le tag de la Release v2 (par exemple `video-12`) pour être sûr d’utiliser la bonne vidéo ; vide = la plus récente.
5. Musique : coche `generate_music` pour tester la nappe générée, ou dépose ton propre `audio/music.mp3` (voir `audio/README.md`).
6. Attends environ 2 minutes, puis télécharge `gestilys-pub-1080x1920.mp4` (ou la version WhatsApp plus légère) depuis la nouvelle Release.

Si une voix est trop forte ou trop faible, le mixage la normalise automatiquement. Si une phrase déborde sur la suivante, reprends la prise plus courte.

## 6. Droits

Avant de publier : garde une autorisation écrite de la personne dont on entend la voix (modèle dans `voiceover/script.md`, section « Droits d’utilisation commerciale »).
