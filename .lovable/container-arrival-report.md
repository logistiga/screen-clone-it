# Date d’arrivée des conteneurs

- Modifié : `src/pages/conteneurs-en-attente/ConteneursTable.tsx`, `roadmap.md`.
- Ajout d’une colonne « Date d’arrivée » avec date et heure de première création de la ligne (`created_at`), et « — » si absente ou invalide.
- Aucun changement backend, migration, données historiques ou dépendance ; aucune modification du mécanisme de synchronisation.
- Import inutilisé retiré ; fichier de tableau sous 300 lignes.
- Compilation automatique OK ; affichage simulé vérifié sur ordinateur et téléphone sans erreur JavaScript.
- Pas encore déployé en production ; vérification sur une session réelle non effectuée.