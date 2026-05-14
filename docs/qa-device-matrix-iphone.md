# QA Device Matrix — iPhone 14+ (Lafay Tracker)

Objectif: valider rapidement que l'UI reste lisible, tappable et stable sur iPhone récents.

## Appareils cibles

- iPhone 14 / 15 / 16 (390-393 pt)
- iPhone 16 / 16 Pro (402 pt)
- iPhone 14 Plus / 15 Pro Max / 16 Pro Max (428-430 pt)

## Orientations

- Portrait
- Paysage

## Ecrans a verifier

- `/`
- `/programs`
- `/programs/:slug`
- `/session?workoutId=...`
- `/timer`
- `/session/:workoutId/complete`
- `/profile`
- `/settings`

## Checklist rapide (global)

- [ ] Aucun texte coupe dans la topbar (marque + actions)
- [ ] Navigation basse lisible, labels non tronques
- [ ] Tous les boutons principaux >= 48 px de hauteur
- [ ] Aucun zoom automatique iOS lors de la saisie
- [ ] Safe areas respectees (haut / bas) sur Dynamic Island et home indicator
- [ ] Aucun debordement horizontal

## Checklist par ecran

### Home
- [ ] Carte hero complete sans chevauchement
- [ ] Liste niveaux lisible (titre, sous-texte, CTA)
- [ ] CTA "Demarrer la seance" visible sans effort

### Programs + Detail
- [ ] Filtres utilisables a une main
- [ ] Cartes niveau: badges + CTA alignes
- [ ] Sur detail: bloc exercices compact et lisible
- [ ] Ligne exercice affiche code, nom, series/reps, repos, tempo, groupe, ref livre

### Session
- [ ] Header (niveau/seance/progression) lisible en portrait et paysage
- [ ] Grille des series reste exploitable (pas de superposition)
- [ ] CTA bas ecran toujours accessible
- [ ] Bottom sheet reps et timer non coupes
- [ ] Etat unilateraux (droite/gauche) bien visible

### Timer
- [ ] Anneau + compteur centras correctement
- [ ] Presets cliquables sans erreurs de touche
- [ ] Controles `+10`, `Pause/Reprendre`, `Reset` alignes
- [ ] En paysage: layout 2 colonnes stable

### Session Complete
- [ ] KPI visibles et non tronques
- [ ] Formulaire journal completement utilisable
- [ ] Boutons finaux visibles sans scroll excessif

### Profile / Settings
- [ ] Inputs, toggles et selects lisibles
- [ ] Alignements des lignes de preference corrects
- [ ] Aucun overflow sur valeurs longues

## Defauts critiques (bloquants)

- Texte inaccessible
- Bouton principal hors ecran
- Sheet coupee / impossible a fermer
- Element cliquable trop petit ou superpose
- Saisie impossible sans zoom parasite

## Procedure de test conseillee

1. Ouvrir chaque ecran en portrait puis paysage.
2. Tester scroll + focus input + ouverture/fermeture sheets.
3. Valider les CTA principaux en conditions "pouce" (une main).
4. Capturer screenshot avant/apres en cas d'anomalie.

