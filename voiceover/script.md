# Voix off Gestilys — texte, minutage, droits (version 2 : avec essai gratuit)

Voix souhaitée : homme adulte, chaleureux, posé, professionnel, français impeccable, légère couleur ouest-africaine naturelle (sans caricature).
Rythme : environ 140 à 150 mots par minute, sans précipitation. Une courte respiration entre les phrases.

> Comment enregistrer avec un téléphone Samsung et ajouter les fichiers au projet : voir `voiceover/guide-enregistrement.md`.

## Texte définitif (configuration par défaut : élèves, paiements, bulletins)

Durée totale de la vidéo : 43 s. Les instants ci-dessous sont ceux où chaque phrase **commence**. Ils sont déjà dans `config/video.config.json` (`audio.voiceoverCues`).

| N° | Début | Séquence | Phrase à dire | Durée max. |
|---|---|---|---|---|
| 01 | 0,6 s | Le problème | Gérer une école demande du temps… et de l’organisation. | 4,0 s |
| 02 | 4,8 s | Le problème | Entre les registres, les paiements et les bulletins, tout s’accumule. | 3,8 s |
| 03 | 9,6 s | La transition | Et si vous simplifiiez votre quotidien ? | 2,8 s |
| 04 | 13,0 s | La transition | Voici Gestilys. | 1,5 s |
| 05 | 15,6 s | Élèves et classes | Gérez vos élèves et leurs classes. | 2,8 s |
| 06 | 20,2 s | Paiements | Suivez les paiements de la scolarité. | 3,0 s |
| 07 | 24,9 s | Bulletins | Préparez les bulletins scolaires, tout au même endroit. | 3,8 s |
| 08 | 30,0 s | Signature | Gestilys. Votre école, mieux organisée. | 3,0 s |
| 09 | 35,0 s | Écran final (carte « essai gratuit ») | Profitez de 7 jours d’essai gratuit de Gestilys ! | 3,6 s |
| 10 | 38,9 s | Écran final (contact) | Contactez-nous sur WhatsApp pour commencer. | 3,4 s |

Règle : ne mentionner à la voix que les fonctionnalités réellement disponibles dans Gestilys et affichées à l’écran. Pas de chiffres autres que « 7 jours », pas de promesse de résultats. Aucun numéro de téléphone n’est dit ni affiché dans cette version.

À l’écran, la carte finale apparaît à 34,4 s (titre « Profitez de 7 jours d’essai gratuit de Gestilys ! »), puis la ligne « Contactez-nous sur WhatsApp pour commencer. » apparaît à 38,4 s. La voix démarre donc juste après chaque apparition.

### Variante si les cinq écrans sont activés (`enabled: true` pour inscriptions et reçus)

Chaque écran dure alors 2,8 s. Remplace les lignes 05 à 07 par :

| N° | Début | Phrase |
|---|---|---|
| 05 | 15,5 s | Gérez vos élèves et leurs classes. |
| 06 | 18,3 s | Simplifiez les inscriptions. |
| 07 | 21,1 s | Suivez les paiements. |
| 08 | 23,9 s | Éditez les reçus… |
| 09 | 26,7 s | et préparez les bulletins. |
| 10 | 30,0 s | Gestilys. Votre école, mieux organisée. |
| 11 | 35,0 s | Profitez de 7 jours d’essai gratuit de Gestilys ! |
| 12 | 38,9 s | Contactez-nous sur WhatsApp pour commencer. |

et mets à jour `audio.voiceoverCues` : `[0.6, 4.8, 9.6, 13.0, 15.5, 18.3, 21.1, 23.9, 26.7, 30.0, 35.0, 38.9]`.

## Comment fournir la voix (gratuit)

**Méthode recommandée : enregistrer chaque phrase séparément, sur le téléphone.**

1. Trouve une personne dont la voix correspond (toi-même, un proche, un comédien local, un animateur radio) dans une pièce calme (rideaux, canapé, pas d’écho, pas de ventilateur).
2. Application **Enregistreur vocal Samsung** (déjà installée), micro à 15–20 cm de la bouche, qualité élevée.
3. Enregistre **une phrase par fichier**, en laissant 1 seconde de silence avant et après. Refais la prise jusqu’à ce qu’elle sonne naturelle.
4. Renomme les fichiers : `voiceover-01.m4a`, `voiceover-02.m4a`, … `voiceover-10.m4a` (le numéro correspond au tableau).
5. Dépose-les dans `audio/` sur GitHub (Add file → Upload files), puis lance le workflow **Ajouter la voix off et la musique**.

Les phrases sont placées automatiquement aux bons instants. Si une phrase est trop longue pour son créneau (durée max. du tableau), reprends la prise un peu plus vite ou ajuste l’instant de la suivante dans la configuration.

Variante : un seul fichier `audio/voiceover.m4a` qui commence par la phrase 01 (la voix démarre à `audio.voiceoverOffsetSeconds` = 0,6 s). Il faut alors dire tout le texte en respectant le minutage : plus difficile.

## Droits d’utilisation commerciale (à ne pas sauter)

Une publicité diffusée sur les réseaux est un usage commercial. Pour la voix :

- **Ta propre voix ou celle d’un proche** : demande une autorisation écrite simple, signée (nom, date, « j’autorise Gestilys à utiliser ma voix dans ses publicités, sur tous supports, sans limite de durée », rémunération éventuelle). Garde une photo de ce document.
- **Comédien ou animateur professionnel** : convenez par écrit des supports, de la durée et du prix. La voix d’un artiste connu ne se réutilise pas sans accord.
- **Voix de synthèse (IA)** : aucune méthode gratuite vérifiée ici ne donne une voix ouest-africaine naturelle avec licence commerciale claire. Si tu en essaies une, lis les conditions du service avant de publier : beaucoup de formules gratuites interdisent l’usage commercial ou exigent une mention. Garde une capture des conditions du jour du téléchargement. Je n’ai pas généré de voix de synthèse dans ce projet.
