# Dossier audio

Dépose ici (GitHub → Add file → Upload files) les fichiers à mixer avec la vidéo. Tout est facultatif : sans fichier, la vidéo contient une piste audio silencieuse.

| Fichier | Rôle |
|---|---|
| `voiceover-01.m4a` … `voiceover-09.m4a` | une phrase par fichier, placée automatiquement (voir `voiceover/script.md`) |
| `voiceover.m4a` | ou un seul fichier de voix qui démarre à 0,6 s |
| `music.mp3` | musique de fond (abaissée automatiquement sous la voix, fondu d’entrée et de sortie) |

Formats acceptés : m4a, mp3, wav, aac, ogg, opus, flac, 3gp (l’extension du fichier doit correspondre).
Si `voiceover-NN` et `voiceover` existent ensemble, ce sont les `voiceover-NN` qui sont utilisés.

Ensuite : Actions → **Ajouter la voix off et la musique** → Run workflow.

## Musique de fond

Trois possibilités, de la plus simple à la plus personnelle :

1. **Aucune musique** : rien à faire.
2. **Nappe musicale générée** : au lancement du workflow, coche `generate_music`. Une ambiance douce est synthétisée par FFmpeg (créée par ce projet : aucun droit d’auteur tiers). Son style est simple et discret ; remplace-la si tu veux mieux.
3. **Ton propre fichier** `music.mp3`, depuis une source qui autorise l’usage commercial. Pistes habituelles (les conditions changent : **vérifie au moment du téléchargement**) : la bibliothèque audio de YouTube (pistes « sans attribution requise »), Pixabay Music (licence Pixabay), Free Music Archive (pistes CC0).

Vérifications avant d’utiliser une musique :
- la licence autorise l’usage commercial et la publicité sur les réseaux sociaux ;
- une mention d’auteur est-elle exigée ? (si oui, ajoute-la dans la description de la publication) ;
- garde l’adresse de la page et une capture d’écran de la licence ;
- certaines plateformes peuvent signaler une musique « libre » à tort (réclamation automatique) : conserve ta preuve de licence.
