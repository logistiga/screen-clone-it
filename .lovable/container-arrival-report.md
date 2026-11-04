# Date d’arrivée des conteneurs

- Modifié : `src/pages/conteneurs-en-attente/ConteneursTable.tsx`, `roadmap.md`.
- Ajout d’une colonne « Date d’arrivée » avec date et heure de première création de la ligne (`created_at`), et « — » si absente ou invalide.
- Aucun changement backend, migration, données historiques ou dépendance ; aucune modification du mécanisme de synchronisation.
- Import inutilisé retiré ; fichier de tableau sous 300 lignes.
- Compilation automatique OK ; affichage simulé vérifié sur ordinateur et téléphone sans erreur JavaScript.
- Déployé le 04/11/2026 sur `facturation.logistiga.pro`, frontend uniquement ; aucune modification backend ni donnée.
- Sauvegarde : `/home/logiwkuh/backup_container_arrival_20261104_140612.tgz` ; archive inspectée (425 entrées), index et fichier conteneurs vérifiés par SHA-256, site et fichier conteneurs HTTP 200.
- Vérification de la colonne sur une session réelle non effectuée : aucune session utilisateur de production disponible.