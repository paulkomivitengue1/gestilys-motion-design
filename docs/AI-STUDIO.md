# Gestilys AI Studio — premier agent

## Ce que fait cette première version

Le workflow manuel **Gestilys AI Studio — scénario publicitaire** transforme un brief en proposition de scénario en français avec Gemini. Il produit :

- `proposal.json` : proposition structurée à examiner ;
- `scenario.md` : version lisible du texte et des fonctionnalités retenues.

Le workflow ne modifie jamais `config/video.config.json`, ne lance pas le rendu vidéo et ne publie rien. Toute proposition porte le statut `DRAFT_REQUIRES_HUMAN_APPROVAL`.

## Configuration (une seule fois)

1. Dans Google AI Studio, crée une clé Gemini API : https://aistudio.google.com/apikey
2. Dans GitHub, ouvre **Settings → Secrets and variables → Actions → New repository secret**.
3. Nom : `GEMINI_API_KEY`. Valeur : la clé API. Ne la place jamais dans un fichier, le brief ou une conversation.
4. Enregistre le secret.

Le modèle est configurable dans le formulaire du workflow. Le modèle par défaut peut être remplacé si Google le retire ou le renomme.

## Lancer un scénario

1. Ouvre l'onglet **Actions** du dépôt.
2. Choisis **Gestilys AI Studio — scénario publicitaire** puis **Run workflow**.
3. Écris un brief précis : public visé, problème, objectif, ton et fonctionnalités à présenter.
4. Lance le workflow.
5. Télécharge l'artefact `gestilys-ai-studio-proposition` et relis `scenario.md` et `proposal.json`.

## Garde-fous

- Liste blanche des fonctionnalités activées dans `config/video.config.json` : l'IA ne peut pas activer une fonctionnalité désactivée.
- Refus des identifiants de fonctionnalités inconnus ou répétés.
- Durée proposée contrôlée entre 25 et 30 secondes.
- La configuration de rendu existante n'est jamais écrasée.
- Validation humaine obligatoire avant toute intégration au rendu ou publication.
- N'envoyez aucune donnée personnelle d'élève, parent, enseignant ou école. Les briefs doivent rester génériques.
- L'offre gratuite de fournisseurs IA peut avoir des limites et des conditions d'utilisation spécifiques ; vérifiez-les avant usage commercial.

## Limites actuelles

C'est le premier agent (brief → scénario contrôlé), pas encore un réalisateur autonome. Il ne crée pas encore les personnages, les voix, la musique ou le MP4. L'intégration au moteur Playwright/FFmpeg sera un jalon séparé, après validation de la qualité des scénarios.
