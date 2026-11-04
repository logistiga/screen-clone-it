# Correction des filtres catégorie OT et factures

## Fichiers
- Frontend modifié : `src/pages/OrdresTravail.tsx`, `src/pages/Factures.tsx`, `src/lib/api/commercial/documents-api.ts`.
- Backend modifié : `backend/app/Http/Controllers/Api/FactureController.php`.
- Tests créés : `backend/tests/Unit/DocumentCategoryTest.php`, `e2e/category-filters.spec.ts`.
- Documentation modifiée : `AGENTS.md`, `roadmap.md` ; ce rapport créé.
- Aucun fichier supprimé.

## Correction
- Les catégories proposées par l'écran factures étaient ignorées par le serveur, qui n'acceptait que les anciens noms. Le filtre utilise désormais les équivalences DocumentCategory déjà utilisées pour les OT.
- Le choix d'une catégorie ou d'un statut remet les deux listes en première page ; la recherche factures aussi.
- Contrat API factures complété avec le paramètre categorie.
- Suppression de la réparation automatique des annulations au GET factures, conformément à l'interdiction de corriger les anciennes données lors des consultations.

## Vérifications
- PHP : quatre tests, six assertions réussies, aucune connexion à une base.
- Syntaxe PHP contrôlée pour les fichiers concernés.
- Navigateur Python Playwright : six parcours simulés réussis (page 2 → chacune des trois catégories page 1 → toutes catégories), sur les deux écrans.
- Test Playwright TypeScript conservé ; son exécution directe est bloquée par l'absence du navigateur correspondant à la version Node installée. Les mêmes parcours ont été exécutés avec le navigateur Python disponible.
- Régression dépenses : quatre tests réussis avec Bun.
- Compilation automatique sans erreur ; fichiers modifiés/créés de code sous 300 lignes.

## Infrastructure et limites
- Aucune migration, aucun changement de données, aucune nouvelle dépendance projet, aucun secret modifié.
- Pas de déploiement effectué ; les données réelles et la session de production ne sont pas vérifiées.
- Le backend OT reconnaissait déjà les catégories ; sa pagination côté écran était le défaut identifié.