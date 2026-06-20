---
name: Règles maîtres du projet
description: Règles absolues à appliquer automatiquement à chaque création, modification, correction, refactorisation ou génération de code (frontend + backend Laravel).
type: preference
---

# RÈGLES MAÎTRES — À APPLIQUER AUTOMATIQUEMENT

## 1. Analyse obligatoire avant toute action
- Analyser l'existant, comprendre l'architecture, identifier les impacts.
- Déterminer si la demande touche Frontend, Backend, ou les deux.
- Modifier automatiquement toutes les parties nécessaires.
- Maintenir la cohérence frontend ↔ backend.

## 2. Limite de taille — RÈGLE ABSOLUE
- Aucun fichier frontend > **300 lignes**.
- Aucun fichier backend > **300 lignes**.
- Si dépassement (ou risque) → découper, créer sous-fichiers, refactoriser AVANT de terminer.
- S'applique à : pages, components, hooks, services, types, utils (front) / Controllers, Models, Services, Actions, Requests, Resources, Policies, Jobs, Events, Listeners, Tests (back).

## 3. Architecture Frontend (React + TypeScript strict)
```
src/
  pages/  components/  components/ui/  hooks/
  services/  services/api/  types/  utils/
  constants/  lib/  config/
```
- 1 page = assemblage de composants. 1 composant / hook / service = 1 responsabilité.
- Aucun fichier monolithique. Réutiliser avant de créer. Zéro duplication.

## 4. Architecture Backend (`backend/`, Laravel)
- Controllers fins, Services métier, Actions dédiées, Form Requests, API Resources, Policies, Jobs, Events/Listeners, Eloquent propre, relations correctes.
- Structure : `app/Http/Controllers|Requests|Resources`, `app/Models|Services|Actions|Policies|Jobs|Events|Listeners`, `routes/api.php`, `database/migrations`.

## 5. Modifications backend automatiques
Si une demande frontend nécessite du backend → créer/modifier automatiquement routes, controllers, requests, services, actions, resources, models, policies, jobs, migrations, tests. **Jamais de fonctionnalité incomplète.**

## 6. API
- Tous les appels centralisés dans `src/services/api`.
- **Interdit** : `fetch`/`axios` dans les composants.
- Toujours gérer : 401, 403, 419, 422, 429, 500, erreurs réseau, timeout.
- Toujours prévoir : loading, success, error, empty state.

## 7. TypeScript
- Strict mode. Aucun `any` sauf exception justifiée → préférer `unknown`.
- Tout typer : props, états, hooks, réponses API, params, retours.

## 8. Sécurité
- Jamais exposer : password, token, clé API, secret.
- Jamais hardcoder URL API, token, clé API → variables d'environnement.
- Laravel = source de vérité pour validation, permissions, rôles, sécurité.
- Jamais faire confiance au navigateur. Jamais sécuriser uniquement côté front.
- Pas de `dangerouslySetInnerHTML` sauf nécessité absolue.
- Avant livraison : supprimer `console.log/debug`, `dd()`, `dump()`, `var_dump()`, code de test/temporaire.

## 9. Authentification
- Toujours gérer : login, logout, user connecté, session expirée, accès refusé, redirection après 401.
- Permissions réelles vérifiées côté backend.

## 10. Formulaires
- Validation front + back. États loading/success/error/empty.
- Désactiver boutons pendant envoi. Empêcher double soumission. Afficher erreurs backend proprement.

## 11. Performance Frontend
- Éviter rerenders/états inutiles. Supprimer code mort & deps inutiles. Optimiser imports. Réutiliser.

## 12. Performance Backend
- Pas de N+1. Eager loading. Pagination. Requêtes optimisées. Index nécessaires. Ne charger que le nécessaire.

## 13. Dépendances
Avant install : vérifier si déjà présente, si API native suffit, justifier l'ajout.

## 14. Nettoyage automatique (à chaque modification)
Supprimer : imports / variables / fonctions / composants / hooks / types / constantes inutilisés, commentaires obsolètes, code mort.

## 15. Refactorisation continue
À chaque modif : détecter duplication, extraire réutilisable, simplifier, réorganiser imports, réduire complexité. Préserver le comportement. **Refactoriser uniquement les fichiers impactés**, jamais tout le projet sans demande.

## 16. Qualité de code
Propre, lisible, maintenable, modulaire, testable, fortement typé. SRP, SoC, DRY, KISS.

## 17. Contrôles AVANT livraison (checklist systématique)
- [ ] Aucun fichier > 300 lignes (front + back)
- [ ] Aucun secret exposé
- [ ] Aucun import / code mort / debug oublié
- [ ] Architecture, sécurité, performance respectées
- [ ] Front ↔ Back synchronisés

## 18. Rapport obligatoire après chaque génération
**Frontend** : fichiers créés / modifiés / supprimés.
**Backend** : fichiers créés / modifiés / supprimés.
**Refactorisation** : nettoyage, code mort, imports, optimisations.
**Infrastructure** : endpoints, migrations, variables d'env nécessaires.
**Analyse** : hypothèses, risques, points à surveiller.
