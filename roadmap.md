# Correction description des notes de débit

## Actualisation des totaux de caisse
- [x] Identifier les clés d’actualisation incohérentes entre les écrans de caisse et les opérations de paiement.
- [x] Rafraîchir les soldes après les opérations financières réussies et charger toutes les pages des totaux mensuels, sans modifier les anciennes données.
- [x] Tests de régression et parcours simulé entrée/sortie vérifiés ; aucune erreur JavaScript, compilation OK.
- [ ] Vérification des opérations réelles : session de production indisponible ; aucun paiement réel effectué et correction non déployée.

## Date d’arrivée des conteneurs
- [x] Ajouter une colonne affichant la date et l’heure de première présence dans l’application, depuis `created_at`, sans modifier les données.
- [x] Vérifier l’affichage simulé sur ordinateur et téléphone ; date absente affichée « — », compilation OK.
- [x] Déployer la colonne en production avec sauvegarde ; index et fichier conteneurs vérifiés par SHA-256, HTTP 200.

- [x] Afficher les désignations des frais sur la fiche et le PDF, sans modifier les données.
- [x] Vérifier le rendu simulé sur ordinateur et téléphone ; compilation sans erreur.
- [ ] Vérifier une note réelle et son PDF : session de production et environnement PHP indisponibles ici.

## Filtres catégorie OT et factures
- [x] Corriger la transmission et l'application des catégories, sans modifier les données.
- [x] Tester les trois catégories et le retour à la première page : six parcours navigateur simulés, quatre tests PHP réussis.
- [x] Déployer les filtres OT et factures en production avec sauvegarde ; fichiers vérifiés, site et nouveaux assets HTTP 200.
- [ ] Vérifier les filtres sur les données réelles : session utilisateur de production indisponible ; écran de connexion vérifié sans erreur.